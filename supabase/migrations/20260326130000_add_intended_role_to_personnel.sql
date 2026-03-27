-- ============================================================
-- Add intended_role column to personnel
-- Created: 2026-03-26
-- Description: intended_role mező hozzáadása a personnel táblához.
--              Ezzel az adminisztrátor a felvételi lapon jelölheti
--              a tervezett jogosultsági szintet, és a meghívóban
--              eltérés esetén figyelmeztetés jelenik meg.
-- ============================================================

ALTER TABLE personnel
  ADD COLUMN IF NOT EXISTS intended_role TEXT
  CHECK (intended_role IN ('user', 'reader', 'admin'));

COMMENT ON COLUMN personnel.intended_role IS 'Tervezett jogosultsági szint – segít ellenőrizni, hogy a meghívóban a megfelelő szerepkör lett-e kiválasztva.';
