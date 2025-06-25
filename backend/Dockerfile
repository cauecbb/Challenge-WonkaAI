# Use the official PostgreSQL image
FROM postgres:15-alpine

# Set environment variables for PostgreSQL
ENV POSTGRES_DB=meetwonka_db
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=password

# Expose PostgreSQL port
EXPOSE 5432

# Create a directory for initialization scripts
COPY ./init-scripts/ /docker-entrypoint-initdb.d/

# Set the default command
CMD ["postgres"] 