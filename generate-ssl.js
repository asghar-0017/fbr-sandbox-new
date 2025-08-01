import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const sslDir = path.join(process.cwd(), 'ssl');

// Create ssl directory if it doesn't exist
if (!fs.existsSync(sslDir)) {
  fs.mkdirSync(sslDir, { recursive: true });
}

console.log('🔐 Generating self-signed SSL certificates...');

try {
  // Generate private key
  execSync(`openssl genrsa -out ${path.join(sslDir, 'key.pem')} 2048`, { stdio: 'inherit' });
  
  // Generate certificate signing request
  execSync(`openssl req -new -key ${path.join(sslDir, 'key.pem')} -out ${path.join(sslDir, 'csr.pem')} -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"`, { stdio: 'inherit' });
  
  // Generate self-signed certificate
  execSync(`openssl x509 -req -days 365 -in ${path.join(sslDir, 'csr.pem')} -signkey ${path.join(sslDir, 'key.pem')} -out ${path.join(sslDir, 'cert.pem')}`, { stdio: 'inherit' });
  
  // Clean up CSR file
  fs.unlinkSync(path.join(sslDir, 'csr.pem'));
  
  console.log('✅ SSL certificates generated successfully!');
  console.log('📁 Certificates saved in:', sslDir);
  console.log('🔒 You can now start the server with HTTPS support');
  
} catch (error) {
  console.error('❌ Error generating SSL certificates:', error.message);
  console.log('💡 Make sure OpenSSL is installed on your system');
  console.log('   Windows: Download from https://slproweb.com/products/Win32OpenSSL.html');
  console.log('   macOS: brew install openssl');
  console.log('   Linux: sudo apt-get install openssl');
} 