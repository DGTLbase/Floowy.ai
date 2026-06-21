UPDATE public.profiles
SET walkthrough_completed = true,
    walkthrough_step = 10
WHERE onboarding_completed = true
  AND walkthrough_completed = false;

UPDATE public.profiles
SET ambience_walkthrough_completed = true,
    ambience_walkthrough_step = 6
WHERE onboarding_completed = true
  AND ambience_walkthrough_completed = false;