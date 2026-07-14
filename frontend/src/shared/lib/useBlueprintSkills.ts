import { useEffect, useState } from 'react';
import { api } from './api';

interface BlueprintRow {
  name: string;
  skillCategory: string | null;
  isArchived: boolean;
}

/**
 * Operator skill certifications are grouped by process family (skillCategory
 * on the Blueprint model), not tied 1:1 to individual blueprint names. A
 * blueprint library can easily hold a dozen+ narrow process templates
 * (extraction, blending-per-fruit, filling-per-format...), which is too
 * granular to certify a person against one at a time — in practice, an
 * operator trained on juice extraction is trained on the whole juice family.
 * Grouping by skillCategory means one certification covers every blueprint
 * in that family, and the taxonomy still comes live from the Blueprint
 * Library (falls back to the blueprint's own name if uncategorized) so it
 * never drifts out of sync as blueprints are added or archived.
 */
export function useBlueprintSkills(): string[] {
  const [skills, setSkills] = useState<string[]>([]);

  useEffect(() => {
    api.get<{ blueprints: BlueprintRow[] }>('/blueprints')
      .then((res) => {
        const categories = new Set(
          res.data.blueprints
            .filter((bp) => !bp.isArchived)
            .map((bp) => bp.skillCategory || bp.name)
        );
        setSkills([...categories].sort((a, b) => a.localeCompare(b)));
      })
      .catch(() => setSkills([]));
  }, []);

  return skills;
}
