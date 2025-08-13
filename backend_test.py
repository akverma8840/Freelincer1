import requests
import sys
import json
from datetime import datetime

class CateringAPITester:
    def __init__(self, base_url="https://gourmet-service-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_items = []  # Track created items for cleanup

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if endpoint else self.api_url
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        if self.token and 'Authorization' not in test_headers:
            test_headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        print(f"   Method: {method}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test GET /api/"""
        return self.run_test("Root API Endpoint", "GET", "", 200)

    def test_get_menu(self):
        """Test GET /api/menu"""
        return self.run_test("Get Public Menu", "GET", "menu", 200)

    def test_get_categories(self):
        """Test GET /api/menu/categories"""
        return self.run_test("Get Menu Categories", "GET", "menu/categories", 200)

    def test_admin_login(self, username="admin", password="admin123"):
        """Test admin login and get token"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"username": username, "password": password}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   Token obtained: {self.token[:50]}...")
            return True
        return False

    def test_get_admin_menu(self):
        """Test GET /api/admin/menu (protected)"""
        if not self.token:
            print("❌ No token available for admin menu test")
            return False
        return self.run_test("Get Admin Menu", "GET", "admin/menu", 200)

    def test_create_menu_item(self, item_data):
        """Test POST /api/admin/menu (protected)"""
        if not self.token:
            print("❌ No token available for create menu item test")
            return False
        
        success, response = self.run_test(
            f"Create Menu Item: {item_data['name']}",
            "POST",
            "admin/menu",
            200,
            data=item_data
        )
        
        if success and 'id' in response:
            self.created_items.append(response['id'])
            return response['id']
        return None

    def test_update_menu_item(self, item_id, update_data):
        """Test PUT /api/admin/menu/{item_id} (protected)"""
        if not self.token:
            print("❌ No token available for update menu item test")
            return False
        
        return self.run_test(
            f"Update Menu Item: {item_id}",
            "PUT",
            f"admin/menu/{item_id}",
            200,
            data=update_data
        )

    def test_delete_menu_item(self, item_id):
        """Test DELETE /api/admin/menu/{item_id} (protected)"""
        if not self.token:
            print("❌ No token available for delete menu item test")
            return False
        
        success, _ = self.run_test(
            f"Delete Menu Item: {item_id}",
            "DELETE",
            f"admin/menu/{item_id}",
            200
        )
        
        if success and item_id in self.created_items:
            self.created_items.remove(item_id)
        
        return success

def main():
    print("🍽️  Starting Catering Service API Tests")
    print("=" * 50)
    
    # Setup
    tester = CateringAPITester()
    
    # Test public endpoints
    print("\n📋 Testing Public Endpoints...")
    tester.test_root_endpoint()
    tester.test_get_menu()
    tester.test_get_categories()
    
    # Test authentication
    print("\n🔐 Testing Authentication...")
    if not tester.test_admin_login():
        print("❌ Admin login failed, stopping admin tests")
        print(f"\n📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
        return 1
    
    # Test protected admin endpoints
    print("\n👨‍💼 Testing Admin Endpoints...")
    tester.test_get_admin_menu()
    
    # Test CRUD operations with sample data
    print("\n🍕 Testing CRUD Operations...")
    
    # Create sample menu items
    sample_items = [
        {
            "name": "Grilled Salmon",
            "description": "Fresh Atlantic salmon with herbs and lemon",
            "price": 24.99,
            "category": "Main Courses",
            "available": True,
            "image_url": "https://example.com/salmon.jpg"
        },
        {
            "name": "Caesar Salad",
            "description": "Crisp romaine lettuce with parmesan and croutons",
            "price": 12.99,
            "category": "Appetizers",
            "available": True
        },
        {
            "name": "Chocolate Cake",
            "description": "Rich chocolate cake with vanilla frosting",
            "price": 8.99,
            "category": "Desserts",
            "available": True
        }
    ]
    
    created_ids = []
    for item in sample_items:
        item_id = tester.test_create_menu_item(item)
        if item_id:
            created_ids.append(item_id)
    
    # Test update operation on first created item
    if created_ids:
        update_data = {
            "name": "Grilled Salmon Deluxe",
            "price": 26.99,
            "description": "Premium Atlantic salmon with herbs, lemon, and seasonal vegetables"
        }
        tester.test_update_menu_item(created_ids[0], update_data)
    
    # Test delete operation on last created item
    if created_ids:
        tester.test_delete_menu_item(created_ids[-1])
    
    # Verify menu has items now
    print("\n🔍 Verifying Menu After CRUD Operations...")
    tester.test_get_menu()
    tester.test_get_categories()
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.created_items:
        print(f"📝 Note: {len(tester.created_items)} menu items were created and left in the system for frontend testing")
        print(f"   Item IDs: {tester.created_items}")
    
    success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
    print(f"✨ Success Rate: {success_rate:.1f}%")
    
    if success_rate >= 80:
        print("🎉 Backend API tests mostly successful!")
        return 0
    else:
        print("⚠️  Backend API has significant issues")
        return 1

if __name__ == "__main__":
    sys.exit(main())