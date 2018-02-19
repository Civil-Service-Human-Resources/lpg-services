CREATE TABLE feedback (
  id               SERIAL PRIMARY KEY,
  created          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  page_url         TEXT NOT NULL,
  went_wrong       TEXT NOT NULL,
  what_doing       TEXT NOT NULL
);
