-- Adding an enum value must be committed before it can be referenced in a
-- USING/CHECK expression, so this is its own migration (see 0008 for the
-- policy and constraint changes that actually use 'draft').
alter type availability_status add value 'draft';
