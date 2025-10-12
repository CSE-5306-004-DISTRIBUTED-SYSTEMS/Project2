
FROM nginx:1.25-alpine

# Copy custom Nginx config into container
COPY nginx.conf /etc/nginx/nginx.conf

# Expose the port you defined in config
EXPOSE 8080

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]