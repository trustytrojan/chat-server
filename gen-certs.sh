CA_KEY_FILE=ca_key.pem
CA_CERT_FILE=ca_cert.pem
SERVER_KEY_FILE=key.pem
SERVER_CERT_FILE=cert.pem
CSR_FILE=csr.pem

DOMAIN=trustytrojan.servehttp.com

# Step 1: Create the CA Private Key
openssl genpkey -algorithm RSA -out $CA_KEY_FILE

# Step 2: Create the CA Certificate
openssl req -new -x509 -key $CA_KEY_FILE -out $CA_CERT_FILE -subj "/"

# Step 3: Copy the CA Certificate to System's CA Store
sudo cp $CA_CERT_FILE /etc/ca-certificates/trust-source/anchors/

# Step 4: Update the System's CA Store
sudo update-ca-trust

# Step 5: Verify the CA Certificate Installation
openssl x509 -in /etc/ssl/certs/ca-certificates.crt -text -noout

# Step 6 - Create a Server Key and Certificate
openssl genpkey -algorithm RSA -out $SERVER_KEY_FILE
openssl req -new -key $SERVER_KEY_FILE -out $CSR_FILE -subj "/CN=$DOMAIN" -addext "subjectAltName=DNS:$DOMAIN"
openssl x509 -req -in $CSR_FILE -CA $CA_CERT_FILE -CAkey $CA_KEY_FILE -CAcreateserial -out $SERVER_CERT_FILE

# Step 7 - Copy Server Certificate and Key
sudo cp $SERVER_CERT_FILE /etc/ssl/certs/$DOMAIN.crt
sudo cp $SERVER_KEY_FILE /etc/ssl/private/$DOMAIN.key

rm $CA_KEY_FILE $CA_CERT_FILE $CSR_FILE *.srl
