import unittest
from app.services.matcher import (
    get_canonical_category,
    are_categories_compatible,
    is_text_match
)

class TestCategoryCompatibilityAndSafeguards(unittest.TestCase):
    def test_canonical_category_mapping(self):
        self.assertEqual(get_canonical_category("Electronics", None, "Laptop"), "ELECTRONICS")
        self.assertEqual(get_canonical_category("Books", None, "Textbook"), "BOOKS")
        self.assertEqual(get_canonical_category("Clothing", "Shirts", "T-Shirt"), "CLOTHING")
        self.assertEqual(get_canonical_category("Furniture", "Chairs", "Dining Table"), "FURNITURE")
        self.assertEqual(get_canonical_category("Food", "Grains", "Rice"), "FOOD")
        self.assertEqual(get_canonical_category("Kitchenware", "Utensils", "Plate"), "KITCHENWARE")

    def test_strict_cross_category_isolation(self):
        # Rule 5 & 6: NGO must only match categories it requested; different categories must never merge
        # Laptop (Electronics) vs Books (Books)
        self.assertFalse(are_categories_compatible("Electronics", None, "laptop", "Books", None, "books"))
        # Books (Books) vs Chair (Furniture)
        self.assertFalse(are_categories_compatible("Books", None, "book", "Furniture", None, "chair"))
        # Clothing vs Food
        self.assertFalse(are_categories_compatible("Clothing", None, "shirt", "Food", None, "rice"))
        # Kitchenware vs Electronics
        self.assertFalse(are_categories_compatible("Kitchenware", None, "cup", "Electronics", None, "keyboard"))

    def test_compatible_category_matching(self):
        # Laptop vs Laptop
        self.assertTrue(are_categories_compatible("Electronics", "Computers", "laptop", "Electronics", "Laptops", "laptop"))
        # Book vs Textbook
        self.assertTrue(are_categories_compatible("Books", "Novels", "book", "Books", "Education", "textbook"))
        # Dining Table vs Chair (both Furniture)
        self.assertTrue(are_categories_compatible("Furniture", "Tables", "dining table", "Furniture", "Seating", "chair"))

    def test_text_match_robustness(self):
        self.assertTrue(is_text_match("laptop", "laptops"))
        self.assertTrue(is_text_match("books", "book"))
        self.assertTrue(is_text_match("boxes", "box"))
        self.assertFalse(is_text_match("laptop", "books"))

if __name__ == "__main__":
    unittest.main()
