function buildProductionDataPayload(job) {
  // Real scrap total — ScrapLog rows are logged by managers per job/stage.
  const actualScrap = job.scrapLogs.reduce((sum, s) => sum + s.quantity, 0);

  // Real QC results — every question an operator answered, across every
  // stage of the job, joined back to its blueprint question text. Free-text
  // responses with no derivable pass/fail are dropped rather than sent as
  // null — ERP's schema requires a real 'pass'/'fail' enum value per entry.
  const qcResults = job.stages
    .flatMap((stage) =>
      stage.qcResponses.map((r) => {
        let passFail = null;
        if (r.passed !== null && r.passed !== undefined) {
          passFail = r.passed ? 'pass' : 'fail';
        } else if (
          r.question.responseType === 'numeric' &&
          r.question.numericMinValue != null &&
          r.question.numericMaxValue != null &&
          r.responseText
        ) {
          const value = Number(r.responseText);
          passFail = value >= r.question.numericMinValue && value <= r.question.numericMaxValue ? 'pass' : 'fail';
        }
        return {
          step: r.question.questionText,
          'pass/fail': passFail,
          notes: r.responseText ?? null,
        };
      })
    )
    .filter((r) => r['pass/fail'] !== null);

  return {
    work_order_id: job.externalWorkOrderId,
    job_id: job.jobId,
    batch_number: job.batchNumber,
    // No process anywhere sets a final "units produced" figure for a job —
    // operators log quantities against blueprint-defined metrics (their
    // names vary per blueprint, e.g. "Units Filled" vs "Juice/Pulp Output")
    // and nothing in the schema flags which one represents finished
    // output. Reporting 0 here rather than guessing at a metric name.
    actual_produced: job.actualProducedQty ?? 0,
    // Rounded — ScrapLog.quantity is a Float on MES's side, but ERP's schema
    // requires an integer.
    actual_scrap: Math.round(actualScrap),
    // qty_used and lot_number still can't be populated for real: there's
    // no link from a JobMaterialRequirement row to the quantity metric(s)
    // an operator actually logs, and Lot/Batch Traceability (raw-material
    // lot capture) hasn't been built. name/unit are the real planned
    // requirement; the rest is honestly null rather than estimated.
    materials_consumed: job.materialRequirements.map((m) => ({
      name: m.name,
      qty_used: null,
      unit: m.unit,
      lot_number: null,
    })),
    downtime_log: job.downtimeLogs.map((d) => ({
      start: d.startedAt,
      end: d.endedAt,
      reason: d.reason,
    })),
    qc_results: qcResults,
  };
}

const PRODUCTION_DATA_INCLUDE = {
  materialRequirements: true,
  downtimeLogs: true,
  scrapLogs: true,
  stages: {
    include: {
      faults: true,
      qcResponses: { include: { question: true } },
    },
  },
};

module.exports = { buildProductionDataPayload, PRODUCTION_DATA_INCLUDE };
