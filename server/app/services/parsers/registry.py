import mimetypes
from typing import Optional, Tuple
import pandas as pd

from app.services.parsers.base import BaseSalesParser
from app.services.parsers.implementations import (
    CSVSalesParser, ExcelSalesParser, JSONSalesParser,
    XMLSalesParser, TXTSalesParser, PDFSalesParser, ZIPSalesParser
)

class ParserRegistry:
    _parsers = {
        'csv': CSVSalesParser(),
        'xlsx': ExcelSalesParser(),
        'xls': ExcelSalesParser(),
        'json': JSONSalesParser(),
        'xml': XMLSalesParser(),
        'txt': TXTSalesParser(),
        'pdf': PDFSalesParser(),
        'zip': ZIPSalesParser()
    }

    @classmethod
    def get_parser(cls, extension: str) -> Optional[BaseSalesParser]:
        return cls._parsers.get(extension.lower())

    @classmethod
    def detect_and_parse(cls, file_bytes: bytes, filename: str) -> Tuple[pd.DataFrame, str, str]:
        """
        Detects file extension and MIME type, chooses the appropriate parser,
        executes it, and returns the DataFrame alongside file details.
        """
        if not filename:
            raise ValueError("File name is required to parse.")

        extension = filename.split('.')[-1].lower() if '.' in filename else ''
        mime_type, _ = mimetypes.guess_type(filename)

        # Standard fallback types
        if not mime_type:
            mime_mappings = {
                'csv': 'text/csv',
                'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'xls': 'application/vnd.ms-excel',
                'json': 'application/json',
                'xml': 'application/xml',
                'txt': 'text/plain',
                'pdf': 'application/pdf',
                'zip': 'application/zip'
            }
            mime_type = mime_mappings.get(extension, 'application/octet-stream')

        parser = cls.get_parser(extension)
        if not parser:
            raise ValueError(f"File extension '.{extension}' is not supported (MIME: {mime_type}).")

        # Delegate parsing to implementation
        df = parser.parse(file_bytes, filename)
        return df, extension, mime_type
