from abc import ABC, abstractmethod
import pandas as pd

class BaseSalesParser(ABC):
    @abstractmethod
    def parse(self, file_bytes: bytes, filename: str) -> pd.DataFrame:
        """
        Parses raw file bytes and returns a pandas DataFrame.
        Should extract tabular sales data in its raw format.
        """
        pass
