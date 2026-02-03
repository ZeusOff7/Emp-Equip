import requests
import sys
from datetime import datetime, timedelta
import json

class EquipmentLoanAPITester:
    def __init__(self, base_url="https://loantrek-3.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.created_equipment_id = None
        self.created_movement_id = None
        self.created_document_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'} if not files else {}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, data=data, files=files)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_stats_endpoint(self):
        """Test stats endpoint"""
        success, response = self.run_test(
            "Get Stats",
            "GET",
            "stats",
            200
        )
        if success:
            print(f"   Stats: {response}")
        return success

    def test_create_equipment(self):
        """Test creating equipment"""
        equipment_data = {
            "name": "Test MacBook Pro",
            "model": "2023 M2 Pro",
            "serial_number": "TEST123456",
            "status": "Available"
        }
        
        success, response = self.run_test(
            "Create Equipment",
            "POST",
            "equipment",
            200,
            data=equipment_data
        )
        
        if success and 'id' in response:
            self.created_equipment_id = response['id']
            print(f"   Created equipment ID: {self.created_equipment_id}")
        return success

    def test_get_all_equipment(self):
        """Test getting all equipment"""
        success, response = self.run_test(
            "Get All Equipment",
            "GET",
            "equipment",
            200
        )
        if success:
            print(f"   Found {len(response)} equipment items")
        return success

    def test_get_equipment_by_id(self):
        """Test getting equipment by ID"""
        if not self.created_equipment_id:
            print("❌ Skipping - No equipment ID available")
            return False
            
        success, response = self.run_test(
            "Get Equipment by ID",
            "GET",
            f"equipment/{self.created_equipment_id}",
            200
        )
        return success

    def test_update_equipment(self):
        """Test updating equipment"""
        if not self.created_equipment_id:
            print("❌ Skipping - No equipment ID available")
            return False
            
        update_data = {
            "name": "Updated MacBook Pro",
            "status": "Maintenance"
        }
        
        success, response = self.run_test(
            "Update Equipment",
            "PUT",
            f"equipment/{self.created_equipment_id}",
            200,
            data=update_data
        )
        return success

    def test_equipment_search(self):
        """Test equipment search functionality"""
        success, response = self.run_test(
            "Search Equipment",
            "GET",
            "equipment?search=MacBook",
            200
        )
        return success

    def test_equipment_filter_by_status(self):
        """Test equipment filtering by status"""
        success, response = self.run_test(
            "Filter Equipment by Status",
            "GET",
            "equipment?status=Available",
            200
        )
        return success

    def test_checkout_equipment(self):
        """Test checking out equipment"""
        if not self.created_equipment_id:
            print("❌ Skipping - No equipment ID available")
            return False
            
        # First update equipment to Available status
        self.run_test(
            "Set Equipment Available",
            "PUT",
            f"equipment/{self.created_equipment_id}",
            200,
            data={"status": "Available"}
        )
        
        checkout_data = {
            "equipment_id": self.created_equipment_id,
            "movement_type": "check_out",
            "borrower_name": "Test User",
            "borrower_email": "test@example.com",
            "delivery_date": (datetime.now() + timedelta(days=1)).isoformat(),
            "expected_return_date": (datetime.now() + timedelta(days=30)).isoformat(),
            "notes": "Test checkout"
        }
        
        success, response = self.run_test(
            "Check Out Equipment",
            "POST",
            "movements",
            200,
            data=checkout_data
        )
        
        if success and 'id' in response:
            self.created_movement_id = response['id']
            print(f"   Created movement ID: {self.created_movement_id}")
        return success

    def test_checkin_equipment(self):
        """Test checking in equipment"""
        if not self.created_equipment_id:
            print("❌ Skipping - No equipment ID available")
            return False
            
        checkin_data = {
            "equipment_id": self.created_equipment_id,
            "movement_type": "check_in",
            "borrower_name": "Test User",
            "borrower_email": "test@example.com"
        }
        
        success, response = self.run_test(
            "Check In Equipment",
            "POST",
            "movements",
            200,
            data=checkin_data
        )
        return success

    def test_get_movements(self):
        """Test getting all movements"""
        success, response = self.run_test(
            "Get All Movements",
            "GET",
            "movements",
            200
        )
        if success:
            print(f"   Found {len(response)} movements")
        return success

    def test_get_movements_by_equipment(self):
        """Test getting movements by equipment ID"""
        if not self.created_equipment_id:
            print("❌ Skipping - No equipment ID available")
            return False
            
        success, response = self.run_test(
            "Get Movements by Equipment",
            "GET",
            f"movements?equipment_id={self.created_equipment_id}",
            200
        )
        return success

    def test_get_overdue_equipment(self):
        """Test getting overdue equipment"""
        success, response = self.run_test(
            "Get Overdue Equipment",
            "GET",
            "movements/overdue",
            200
        )
        if success:
            print(f"   Found {len(response)} overdue items")
        return success

    def test_document_upload(self):
        """Test document upload (mock PDF)"""
        if not self.created_equipment_id:
            print("❌ Skipping - No equipment ID available")
            return False
            
        # Create a mock PDF content
        pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF"
        
        files = {'file': ('test_document.pdf', pdf_content, 'application/pdf')}
        data = {'equipment_id': self.created_equipment_id}
        
        success, response = self.run_test(
            "Upload Document",
            "POST",
            "documents/upload",
            200,
            data=data,
            files=files
        )
        
        if success and 'id' in response:
            self.created_document_id = response['id']
            print(f"   Created document ID: {self.created_document_id}")
        return success

    def test_get_equipment_documents(self):
        """Test getting documents for equipment"""
        if not self.created_equipment_id:
            print("❌ Skipping - No equipment ID available")
            return False
            
        success, response = self.run_test(
            "Get Equipment Documents",
            "GET",
            f"documents/equipment/{self.created_equipment_id}",
            200
        )
        if success:
            print(f"   Found {len(response)} documents")
        return success

    def test_download_document(self):
        """Test downloading document"""
        if not self.created_document_id:
            print("❌ Skipping - No document ID available")
            return False
            
        success, response = self.run_test(
            "Download Document",
            "GET",
            f"documents/{self.created_document_id}/download",
            200
        )
        return success

    def test_delete_document(self):
        """Test deleting document"""
        if not self.created_document_id:
            print("❌ Skipping - No document ID available")
            return False
            
        success, response = self.run_test(
            "Delete Document",
            "DELETE",
            f"documents/{self.created_document_id}",
            200
        )
        return success

    def test_delete_equipment(self):
        """Test deleting equipment"""
        if not self.created_equipment_id:
            print("❌ Skipping - No equipment ID available")
            return False
            
        success, response = self.run_test(
            "Delete Equipment",
            "DELETE",
            f"equipment/{self.created_equipment_id}",
            200
        )
        return success

def main():
    print("🚀 Starting Equipment Loan Management API Tests")
    print("=" * 60)
    
    tester = EquipmentLoanAPITester()
    
    # Test sequence
    tests = [
        tester.test_stats_endpoint,
        tester.test_get_all_equipment,
        tester.test_create_equipment,
        tester.test_get_equipment_by_id,
        tester.test_update_equipment,
        tester.test_equipment_search,
        tester.test_equipment_filter_by_status,
        tester.test_checkout_equipment,
        tester.test_get_movements,
        tester.test_get_movements_by_equipment,
        tester.test_checkin_equipment,
        tester.test_get_overdue_equipment,
        tester.test_document_upload,
        tester.test_get_equipment_documents,
        tester.test_download_document,
        tester.test_delete_document,
        tester.test_delete_equipment
    ]
    
    # Run all tests
    for test in tests:
        test()
    
    # Print results
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"❌ {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())