-- Migration: enforce unique decision per matrix/collaborator/offense
CREATE UNIQUE INDEX IF NOT EXISTS decisions_matrix_collaborator_offense_idx
ON public.decisions (matrix_id, collaborator_email, uccs_code);
