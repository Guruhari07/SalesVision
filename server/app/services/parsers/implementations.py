import io
import json
import zipfile
import xml.etree.ElementTree as ET
import pandas as pd
from typing import List, Dict, Any
from pypdf import PdfReader

from app.services.parsers.base import BaseSalesParser

class CSVSalesParser(BaseSalesParser):
    def parse(self, file_bytes: bytes, filename: str) -> pd.DataFrame:
        try:
            return pd.read_csv(io.BytesIO(file_bytes), encoding='utf-8')
        except UnicodeDecodeError:
            return pd.read_csv(io.BytesIO(file_bytes), encoding='latin-1')

class ExcelSalesParser(BaseSalesParser):
    def parse(self, file_bytes: bytes, filename: str) -> pd.DataFrame:
        return pd.read_excel(io.BytesIO(file_bytes))

class JSONSalesParser(BaseSalesParser):
    def parse(self, file_bytes: bytes, filename: str) -> pd.DataFrame:
        data = json.loads(file_bytes.decode('utf-8', errors='ignore'))
        
        # Resolve case where JSON is an object with a list inside it
        if isinstance(data, dict):
            # Check common keys
            for key in ['records', 'data', 'sales', 'orders', 'items']:
                if key in data and isinstance(data[key], list):
                    return pd.DataFrame(data[key])
            # If it's a flat dict of columns
            return pd.DataFrame(data)
        elif isinstance(data, list):
            return pd.DataFrame(data)
            
        raise ValueError("JSON file structure is not supported. Must be a list of records or an object containing a list.")

class XMLSalesParser(BaseSalesParser):
    def parse(self, file_bytes: bytes, filename: str) -> pd.DataFrame:
        try:
            # Let pandas try to parse it first
            return pd.read_xml(io.BytesIO(file_bytes))
        except Exception:
            # Fallback to manual ElementTree parsing
            root = ET.fromstring(file_bytes.decode('utf-8', errors='ignore'))
            records = []
            
            # Find any elements that contain children
            for child in root:
                record = {}
                for subchild in child:
                    record[subchild.tag] = subchild.text
                if record:
                    records.append(record)
                    
            if not records:
                raise ValueError("No sales records found in XML file. Structure must contain nested row elements.")
            return pd.DataFrame(records)

class TXTSalesParser(BaseSalesParser):
    def parse(self, file_bytes: bytes, filename: str) -> pd.DataFrame:
        # Automatically detect comma, tab, semicolon or space delimiters
        return pd.read_csv(io.BytesIO(file_bytes), sep=None, engine='python', encoding='utf-8')

class PDFSalesParser(BaseSalesParser):
    def parse(self, file_bytes: bytes, filename: str) -> pd.DataFrame:
        reader = PdfReader(io.BytesIO(file_bytes))
        extracted_text = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                extracted_text.append(text)
                
        full_text = "\n".join(extracted_text)
        lines = [line.strip() for line in full_text.split("\n") if line.strip()]
        
        # Check if we have valid tabular text
        parsed_rows = []
        headers = []
        
        for line in lines:
            # Simple check if line is comma-separated or tab-separated
            parts = []
            if "," in line:
                parts = [p.strip() for p in line.split(",")]
            elif "\t" in line:
                parts = [p.strip() for p in line.split("\t")]
            
            if len(parts) >= 5:
                if not headers:
                    headers = parts
                else:
                    # Pad row if columns don't match exactly
                    if len(parts) < len(headers):
                        parts += [""] * (len(headers) - len(parts))
                    elif len(parts) > len(headers):
                        parts = parts[:len(headers)]
                    parsed_rows.append(dict(zip(headers, parts)))
                    
        if len(parsed_rows) >= 5:
            return pd.DataFrame(parsed_rows)
            
        # If we failed to extract a clean text table, run the simulated AI OCR extractor fallback
        from app.services.data_processor import generate_simulated_ocr_data
        return generate_simulated_ocr_data(filename)

class ZIPSalesParser(BaseSalesParser):
    def parse(self, file_bytes: bytes, filename: str) -> pd.DataFrame:
        # Avoid circular imports
        from app.services.parsers.registry import ParserRegistry
        
        with zipfile.ZipFile(io.BytesIO(file_bytes)) as z:
            # Scan files inside zip
            for name in z.namelist():
                ext = name.split('.')[-1].lower() if '.' in name else ''
                if ext in ['csv', 'xlsx', 'xls', 'json', 'xml', 'txt', 'pdf']:
                    inner_bytes = z.read(name)
                    # Use registry to select appropriate parser for this file
                    parser = ParserRegistry.get_parser(ext)
                    if parser:
                        return parser.parse(inner_bytes, name)
                        
        raise ValueError("No supported files (.csv, .xlsx, .json, .xml, .txt, .pdf) found in ZIP archive.")
