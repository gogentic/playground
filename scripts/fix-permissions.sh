#!/bin/bash

echo "Fixing permissions for NGINX to access the dist folder..."

# Add execute permission for others on the home directory
# This allows NGINX to traverse through the directory
chmod o+x /home/ira

# Ensure all parent directories have execute permission
chmod o+x /home/ira/dev
chmod o+x /home/ira/dev/PLAYGROUND

# Give read and execute permissions to the dist folder and its contents
chmod -R o+rx /home/ira/dev/PLAYGROUND/dist

echo "Permissions fixed!"
echo ""
echo "Testing NGINX configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "Reloading NGINX..."
    sudo systemctl reload nginx
    echo "Done! The site should now be accessible."
else
    echo "NGINX configuration test failed."
fi