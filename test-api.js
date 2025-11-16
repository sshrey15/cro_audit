// Test script for the enhanced CRO audit API with interactive product discovery
// Run this to test the API locally

const testUrl = 'https://example-store.com'; // Replace with actual e-commerce site

async function testProductDiscovery() {
    try {
        const response = await fetch('http://localhost:3000/api/audit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: testUrl }),
        });

        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ Product discovery successful!');
            console.log('📸 Screenshots captured:', Object.keys(result).length);
            
            Object.entries(result).forEach(([key, screenshots]) => {
                console.log(`\n📄 ${key.toUpperCase()}:`);
                screenshots.forEach((screenshot, index) => {
                    console.log(`  ${index + 1}. ${screenshot}`);
                });
            });
        } else {
            console.error('❌ Error:', result.error);
        }
        
    } catch (error) {
        console.error('❌ Request failed:', error.message);
    }
}

// Call the test function
testProductDiscovery();