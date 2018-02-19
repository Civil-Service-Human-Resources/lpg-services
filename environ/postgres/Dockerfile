# Postgres 9.6.2 to mirror Azure Postgres
FROM postgres@sha256:5284ba74a1065e34cf1bfccd64caf8c497c8dc623d6207b060b5ebd369427d34

ENV POSTGRES_DB=lpg \
    POSTGRES_USER=user \
    POSTGRES_PASSWORD=password

COPY feedback.sql /docker-entrypoint-initdb.d/feedback.sql
COPY postgres postgres

ENV PATH /:$PATH
RUN ./docker-entrypoint.sh postgres noop
