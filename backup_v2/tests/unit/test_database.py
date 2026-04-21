"""
test_database.py — Unit tests for mcal/database.py
"""
import unittest
from src.mcal.database import u32GetConnection, vInitDB, u32SaveEntry, stEntryListVGetAllEntries

class stTestDatabase(unittest.TestCase):
    def setUp(self):
        vInitDB()

    def test_u32SaveEntryVGetAllEntries(self):
        u32Id = u32SaveEntry("Test entry", {"compound_mean": 0.5})
        stEntries = stEntryListVGetAllEntries(10)
        self.assertGreater(len(stEntries), 0)
        self.assertEqual(stEntries[0]["id"], u32Id)

if __name__ == '__main__':
    unittest.main()

