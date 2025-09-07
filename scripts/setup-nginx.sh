#!/bin/bash

# Setup NGINX for playground.gogentic.ai

echo "Setting up NGINX configuration for playground.gogentic.ai..."

# Copy the config file
sudo cp /home/ira/dev/PLAYGROUND/scripts/nginx-playground.conf /etc/nginx/sites-available/playground.gogentic.ai

# Create symbolic link to enable the site
sudo ln -s /etc/nginx/sites-available/playground.gogentic.ai /etc/nginx/sites-enabled/

# Test NGINX configuration
sudo nginx -t

# If test passes, reload NGINX
if [ $? -eq 0 ]; then
    echo "NGINX configuration is valid. Reloading..."
    sudo systemctl reload nginx
    echo "NGINX reloaded successfully!"
    
    # Get SSL certificate from Let's Encrypt
    echo ""
    echo "To set up SSL, run:"
    echo "sudo certbot --nginx -d playground.gogentic.ai"
else
    echo "NGINX configuration test failed. Please check the configuration."
fi

echo ""
echo "Don't forget to:"
echo "1. Ensure the A record for playground.gogentic.ai points to this server's IP"
echo "2. Run 'sudo certbot --nginx -d playground.gogentic.ai' to set up SSL"