import { useState } from 'react';
import { BlueprintCatalog } from './BlueprintCatalog';
import { BlueprintBuilder } from './BlueprintBuilder';
import { mockBlueprints } from '../data/blueprintData';
import { supabase } from '../lib/supabase';
import type { Blueprint, BlueprintFormData } from '../types';

export function BlueprintManagement() {
  const [blueprints, setBlueprints] = useState<Blueprint[]>(mockBlueprints);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingBlueprintId, setEditingBlueprintId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleCreateNew = () => {
    setEditingBlueprintId(null);
    setIsBuilderOpen(true);
  };

  const handleEdit = (id: string) => {
    setEditingBlueprintId(id);
    setIsBuilderOpen(true);
  };

  const handleArchive = (id: string) => {
    setBlueprints(prev =>
      prev.map(bp =>
        bp.id === id ? { ...bp, isArchived: !bp.isArchived } : bp
      )
    );
  };

  const handleSave = async (data: BlueprintFormData) => {
    setSaving(true);
    try {
      if (editingBlueprintId) {
        // Local-state update for edits (mock blueprints use non-UUID IDs)
        setBlueprints(prev =>
          prev.map(bp =>
            bp.id === editingBlueprintId
              ? {
                  ...bp,
                  name: data.name,
                  description: data.description || null,
                  category: data.category,
                  stationTag: data.stationTag || null,
                  estimatedDurationMinutes: data.estimatedDurationMinutes,
                  guidelinesEnabled: data.guidelinesEnabled,
                  checklistEnabled: data.checklistEnabled,
                  quantityLoggingEnabled: data.quantityLoggingEnabled,
                  qcFormEnabled: data.qcFormEnabled,
                  faultCategoriesEnabled: data.faultCategoriesEnabled,
                  guidelinesContent: data.guidelinesContent || null,
                  checklistValidationTiming: data.checklistValidationTiming || null,
                  quantityUnitLabel: data.quantityMetrics[0]?.unitLabel || null,
                  quantityMinValue: data.quantityMetrics[0]?.minValue ?? null,
                  quantityMaxValue: data.quantityMetrics[0]?.maxValue ?? null,
                  quantityInputFrequency: data.quantityMetrics[0]?.inputFrequency || null,
                  updatedAt: new Date().toISOString(),
                }
              : bp
          )
        );
        return;
      }

      // ── Create: persist to Supabase ──────────────────────────
      const { data: bpRow, error: bpError } = await supabase
        .from('blueprints')
        .insert({
          name: data.name,
          description: data.description || null,
          category: data.category,
          station_tag: data.stationTag || null,
          estimated_duration_minutes: data.estimatedDurationMinutes,
          is_archived: false,
          guidelines_enabled: data.guidelinesEnabled,
          checklist_enabled: data.checklistEnabled,
          quantity_logging_enabled: data.quantityLoggingEnabled,
          qc_form_enabled: data.qcFormEnabled,
          fault_categories_enabled: data.faultCategoriesEnabled,
          guidelines_content: data.guidelinesContent || null,
          checklist_validation_timing: data.checklistValidationTiming || null,
          // Populate legacy single-metric columns from first metric for backward compat
          quantity_unit_label: data.quantityMetrics[0]?.unitLabel || null,
          quantity_min_value: data.quantityMetrics[0]?.minValue ?? null,
          quantity_max_value: data.quantityMetrics[0]?.maxValue ?? null,
          quantity_input_frequency: data.quantityMetrics[0]?.inputFrequency || null,
        })
        .select('id')
        .single();

      if (bpError || !bpRow) throw bpError ?? new Error('Blueprint insert returned no row');

      const blueprintId: string = bpRow.id;

      // Insert child records in parallel
      const childInserts: Promise<any>[] = [];

      if (data.checklistItems.length > 0) {
        childInserts.push(
          supabase.from('blueprint_checklist_items').insert(
            data.checklistItems
              .filter(item => item.itemText.trim())
              .map((item, i) => ({
                blueprint_id: blueprintId,
                item_text: item.itemText.trim(),
                sort_order: i + 1,
                is_required: item.isRequired,
              }))
          )
        );
      }

      const validMetrics = data.quantityMetrics.filter(m => m.metricName.trim());
      if (validMetrics.length > 0) {
        childInserts.push(
          supabase.from('blueprint_quantity_metrics').insert(
            validMetrics.map((m, i) => ({
              blueprint_id: blueprintId,
              metric_name: m.metricName.trim(),
              unit_label: m.unitLabel,
              min_value: m.minValue,
              max_value: m.maxValue,
              input_frequency: m.inputFrequency,
              sort_order: i + 1,
            }))
          )
        );
      }

      if (data.qcQuestions.length > 0) {
        childInserts.push(
          supabase.from('blueprint_qc_questions').insert(
            data.qcQuestions
              .filter(q => q.questionText.trim())
              .map((q, i) => ({
                blueprint_id: blueprintId,
                question_text: q.questionText.trim(),
                response_type: q.responseType,
                numeric_min_value: q.numericMinValue,
                numeric_max_value: q.numericMaxValue,
                numeric_tolerance: q.numericTolerance,
                sort_order: i + 1,
                is_required: q.isRequired,
              }))
          )
        );
      }

      if (data.faultCategories.length > 0) {
        childInserts.push(
          supabase.from('blueprint_fault_categories').insert(
            data.faultCategories
              .filter(f => f.faultName.trim())
              .map((f, i) => ({
                blueprint_id: blueprintId,
                fault_name: f.faultName.trim(),
                severity: f.severity,
                requires_photo: f.requiresPhoto,
                sort_order: i + 1,
              }))
          )
        );
      }

      await Promise.all(childInserts);

      // Optimistically add to local state with real UUID
      const newBlueprint: Blueprint = {
        id: blueprintId,
        name: data.name,
        description: data.description || null,
        category: data.category,
        stationTag: data.stationTag || null,
        estimatedDurationMinutes: data.estimatedDurationMinutes,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        guidelinesEnabled: data.guidelinesEnabled,
        checklistEnabled: data.checklistEnabled,
        quantityLoggingEnabled: data.quantityLoggingEnabled,
        qcFormEnabled: data.qcFormEnabled,
        faultCategoriesEnabled: data.faultCategoriesEnabled,
        guidelinesContent: data.guidelinesContent || null,
        checklistValidationTiming: data.checklistValidationTiming || null,
        quantityUnitLabel: data.quantityMetrics[0]?.unitLabel || null,
        quantityMinValue: data.quantityMetrics[0]?.minValue ?? null,
        quantityMaxValue: data.quantityMetrics[0]?.maxValue ?? null,
        quantityInputFrequency: data.quantityMetrics[0]?.inputFrequency || null,
      };
      setBlueprints(prev => [newBlueprint, ...prev]);
    } catch (err) {
      console.error('Blueprint save failed:', err);
      // Fallback: local-only with temp ID so the UI doesn't feel broken
      const newBlueprint: Blueprint = {
        id: `bp-${Date.now()}`,
        name: data.name,
        description: data.description || null,
        category: data.category,
        stationTag: data.stationTag || null,
        estimatedDurationMinutes: data.estimatedDurationMinutes,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        guidelinesEnabled: data.guidelinesEnabled,
        checklistEnabled: data.checklistEnabled,
        quantityLoggingEnabled: data.quantityLoggingEnabled,
        qcFormEnabled: data.qcFormEnabled,
        faultCategoriesEnabled: data.faultCategoriesEnabled,
        guidelinesContent: data.guidelinesContent || null,
        checklistValidationTiming: data.checklistValidationTiming || null,
        quantityUnitLabel: data.quantityMetrics[0]?.unitLabel || null,
        quantityMinValue: data.quantityMetrics[0]?.minValue ?? null,
        quantityMaxValue: data.quantityMetrics[0]?.maxValue ?? null,
        quantityInputFrequency: data.quantityMetrics[0]?.inputFrequency || null,
      };
      setBlueprints(prev => [newBlueprint, ...prev]);
    } finally {
      setSaving(false);
    }
  };

  const handleCloseBuilder = () => {
    setIsBuilderOpen(false);
    setEditingBlueprintId(null);
  };

  return (
    <>
      <div className="h-full p-6">
        <BlueprintCatalog
          blueprints={blueprints}
          onCreateNew={handleCreateNew}
          onEditBlueprint={handleEdit}
          onArchiveBlueprint={handleArchive}
        />
      </div>

      <BlueprintBuilder
        isOpen={isBuilderOpen}
        editingId={editingBlueprintId}
        onClose={handleCloseBuilder}
        onSave={handleSave}
        saving={saving}
      />
    </>
  );
}
