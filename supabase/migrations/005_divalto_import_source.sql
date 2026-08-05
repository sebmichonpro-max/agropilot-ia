-- Add Divalto import sources to prev_import_batches
ALTER TABLE prev_import_batches
  DROP CONSTRAINT IF EXISTS prev_import_batches_source_check;

ALTER TABLE prev_import_batches
  ADD CONSTRAINT prev_import_batches_source_check
  CHECK (source IN ('csv', 'manual', 'divalto_tiers', 'divalto_article'));
