
-- Deactivate 7 models to bring total to 100
-- Remove the 11 with old paths minus 4 to keep = remove 7 of them
UPDATE default_models SET is_active = false WHERE name IN ('Amara', 'Leila', 'Lin', 'Lucia', 'Marcus', 'Priya', 'Rosa');
