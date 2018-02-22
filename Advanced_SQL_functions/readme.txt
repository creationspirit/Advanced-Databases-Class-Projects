CREATE DATABASE "Projekt1"
  WITH OWNER = postgres
       ENCODING = 'UTF8'
       TABLESPACE = pg_default
       LC_COLLATE = 'en_US.UTF-8'
       LC_CTYPE = 'en_US.UTF-8'
       CONNECTION LIMIT = -1;

CREATE EXTENSION pg_trgm
  SCHEMA public
  VERSION "1.1";

CREATE EXTENSION plpgsql
  SCHEMA pg_catalog
  VERSION "1.0";
  
CREATE EXTENSION tablefunc
  SCHEMA public
  VERSION "1.0";

CREATE TABLE movie
(
  movieid serial NOT NULL,
  title character varying(255),
  categories character varying(255),
  summary text,
  description text,
  alltsv tsvector,
  CONSTRAINT movie_pkey PRIMARY KEY (movieid)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE movie
  OWNER TO postgres;

CREATE TABLE querylog
(
  id serial NOT NULL,
  squery character(200),
  tstamp timestamp with time zone,
  CONSTRAINT pk_querylog PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE querylog
  OWNER TO postgres;

CREATE INDEX alltsvidx
  ON movie
  USING gin
  (alltsv);

CREATE INDEX summary_trigram_idx
  ON movie
  USING gist
  (summary COLLATE pg_catalog."default" gist_trgm_ops);
  
CREATE OR REPLACE FUNCTION update_all_tsv()
  RETURNS trigger AS
$BODY$
	BEGIN
		IF NEW.title IS NULL THEN
			RAISE EXCEPTION 'title cannot be null';
		END IF;
		IF NEW.categories IS NULL THEN
			RAISE EXCEPTION 'categories cannot be null';
		END IF;
		IF NEW.summary IS NULL THEN
			RAISE EXCEPTION 'summary cannot be null';
		END IF;
		IF NEW.description IS NULL THEN
			RAISE EXCEPTION 'description cannot be null';
		END IF;

		NEW.alltsv := setweight(to_tsvector('english', NEW.title), 'A') ||
			setweight(to_tsvector('english', NEW.categories), 'B') ||
			setweight(to_tsvector('english', NEW.summary), 'C') ||
			setweight(to_tsvector('english', NEW.description), 'D');
		RETURN NEW;
	END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;
ALTER FUNCTION update_all_tsv()
  OWNER TO postgres;

CREATE TRIGGER movie_insupd_trigger
  BEFORE INSERT OR UPDATE
  ON movie
  FOR EACH ROW
  EXECUTE PROCEDURE update_all_tsv();


