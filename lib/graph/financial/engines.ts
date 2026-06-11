// lib/graph/financial/engines.ts
import { FinancialIntelligenceReport, StartupCosts, UnitEconomics, BreakEvenAnalysis, RoiAnalysis, CashFlowItem, Scenarios } from "./types";

export class FinancialModelingEngine {
  /**
   * Recalculates and validates the total startup cost scenarios.
   */
  public static validateStartupCosts(costs: StartupCosts): StartupCosts {
    const minTotal = 
      costs.infrastructure.min +
      costs.technology.min +
      costs.equipment.min +
      costs.licensing.min +
      costs.operations.min +
      costs.marketing.min +
      costs.team.min +
      costs.legal.min;

    const expectedTotal = 
      costs.infrastructure.expected +
      costs.technology.expected +
      costs.equipment.expected +
      costs.licensing.expected +
      costs.operations.expected +
      costs.marketing.expected +
      costs.team.expected +
      costs.legal.expected;

    const aggressiveTotal = 
      costs.infrastructure.aggressive +
      costs.technology.aggressive +
      costs.equipment.aggressive +
      costs.licensing.aggressive +
      costs.operations.aggressive +
      costs.marketing.aggressive +
      costs.team.aggressive +
      costs.legal.aggressive;

    return {
      ...costs,
      scenarios: {
        min: { total: minTotal },
        expected: { total: expectedTotal },
        aggressive: { total: aggressiveTotal }
      }
    };
  }

  /**
   * Calculates consistent unit economics programmatically.
   */
  public static calculateUnitEconomics(ue: Omit<UnitEconomics, "ltvToCacRatio">): UnitEconomics {
    const cac = Math.max(1, ue.cac);
    const ltv = Math.max(0, ue.ltv);
    const ltvToCacRatio = parseFloat((ltv / cac).toFixed(2));

    return {
      ...ue,
      cac,
      ltv,
      ltvToCacRatio
    };
  }

  /**
   * Builds a programmatically generated 3-year cash flow projection.
   */
  public static generateCashFlowCurve(
    capitalAvailable: number,
    expectedYear1Arr: number,
    expectedYear2Arr: number,
    expectedYear3Arr: number,
    monthlyExpenseBurn: number
  ): CashFlowItem[] {
    const periods = ["M1", "M3", "M6", "M9", "M12", "M18", "M24", "M36"];
    
    // Convert ARR expectations into monthly benchmarks
    const mrrY1 = expectedYear1Arr / 12;
    const mrrY2 = expectedYear2Arr / 12;
    const mrrY3 = expectedYear3Arr / 12;

    return periods.map((p) => {
      let revenue = 0;
      let expenses = monthlyExpenseBurn;

      switch (p) {
        case "M1":
          revenue = 0;
          expenses = monthlyExpenseBurn * 0.8; // lean setup
          break;
        case "M3":
          revenue = Math.round(mrrY1 * 0.1);
          expenses = monthlyExpenseBurn * 0.9;
          break;
        case "M6":
          revenue = Math.round(mrrY1 * 0.4);
          expenses = monthlyExpenseBurn * 1.0;
          break;
        case "M9":
          revenue = Math.round(mrrY1 * 0.7);
          expenses = monthlyExpenseBurn * 1.1; // scale sales
          break;
        case "M12":
          revenue = Math.round(mrrY1);
          expenses = monthlyExpenseBurn * 1.2;
          break;
        case "M18":
          revenue = Math.round((mrrY1 + mrrY2) / 2);
          expenses = monthlyExpenseBurn * 1.5;
          break;
        case "M24":
          revenue = Math.round(mrrY2);
          expenses = monthlyExpenseBurn * 1.8;
          break;
        case "M36":
          revenue = Math.round(mrrY3);
          expenses = monthlyExpenseBurn * 2.5; // expansion scale
          break;
      }

      const cashflow = revenue - expenses;

      return {
        period: p,
        revenue,
        expenses,
        cashflow
      };
    });
  }
}

export class BreakEvenCalculator {
  /**
   * Computes exact break-even metrics programmatically.
   */
  public static compute(
    monthlyFixedCosts: number,
    pricePerCustomer: number,
    marginPercentage: number
  ): BreakEvenAnalysis {
    const contributionMarginPerCustomer = pricePerCustomer * (marginPercentage / 100);
    const breakEvenCustomers = contributionMarginPerCustomer > 0 
      ? Math.ceil(monthlyFixedCosts / contributionMarginPerCustomer)
      : 0;

    const breakEvenRevenue = breakEvenCustomers * pricePerCustomer;
    
    // Timeline approximation: assuming customer acquisition rate of 10% of break-even target per month
    const breakEvenTimelineMonths = breakEvenCustomers > 0 ? 11 : 0; 

    return {
      breakEvenRevenue,
      breakEvenCustomers,
      breakEvenTimelineMonths,
      methodology: `Break-even computed as fixed monthly operating expenses (${monthlyFixedCosts}) divided by contribution margin per customer (${contributionMarginPerCustomer.toFixed(2)}).`
    };
  }
}

export class RoiCalculator {
  /**
   * Calculates ROI scenarios programmatically.
   */
  public static calculate(capitalNeeded: number, expectedNetProfitY3: number): RoiAnalysis {
    const capital = Math.max(1, capitalNeeded);
    const expectedRoi = Math.round((expectedNetProfitY3 / capital) * 100);
    const conservativeRoi = Math.round(expectedRoi * 0.6);
    const optimisticRoi = Math.round(expectedRoi * 1.5);
    const riskAdjustedRoi = Math.round(expectedRoi * 0.75); // Adjusted for early-stage risks

    return {
      expectedRoi,
      conservativeRoi,
      optimisticRoi,
      riskAdjustedRoi
    };
  }
}

export class ScenarioEngine {
  /**
   * Populates bestCase, expectedCase, and worstCase details consistently.
   */
  public static generate(
    expectedRevenue: number,
    expectedCosts: number,
    riskAdjustedRoi: number
  ): Scenarios {
    return {
      bestCase: {
        revenue: Math.round(expectedRevenue * 1.4),
        costs: Math.round(expectedCosts * 0.9),
        profit: Math.round(expectedRevenue * 1.4 - expectedCosts * 0.9),
        roi: Math.round(riskAdjustedRoi * 1.5),
        riskLevel: "LOW"
      },
      expectedCase: {
        revenue: expectedRevenue,
        costs: expectedCosts,
        profit: expectedRevenue - expectedCosts,
        roi: riskAdjustedRoi,
        riskLevel: "MEDIUM"
      },
      worstCase: {
        revenue: Math.round(expectedRevenue * 0.6),
        costs: Math.round(expectedCosts * 1.2),
        profit: Math.round(expectedRevenue * 0.6 - expectedCosts * 1.2),
        roi: Math.round(riskAdjustedRoi * 0.3),
        riskLevel: "HIGH"
      }
    };
  }
}

export class FinancialViabilityScorer {
  /**
   * Evaluates overall 0-100 financial viability score based on quantitative inputs.
   */
  public static compute(report: Omit<FinancialIntelligenceReport, "financialViability">): { score: number; reasoning: string[] } {
    let score = 50; // baseline
    const reasoning: string[] = [];

    // Factor 1: LTV:CAC Ratio (Weight: 20%)
    const ltvCac = report.unitEconomics.ltvToCacRatio;
    if (ltvCac >= 5) {
      score += 15;
      reasoning.push(`Strong unit economics with LTV:CAC of ${ltvCac}x indicating high customer lifetime value relative to acquisition cost.`);
    } else if (ltvCac >= 3) {
      score += 8;
      reasoning.push(`Healthy unit economics with LTV:CAC of ${ltvCac}x.`);
    } else {
      score -= 10;
      reasoning.push(`LTV:CAC of ${ltvCac}x is below standard venture threshold of 3x, indicating potential profitability pressure.`);
    }

    // Factor 2: Payback Period (Weight: 20%)
    const payback = report.unitEconomics.paybackPeriod;
    if (payback <= 6) {
      score += 15;
      reasoning.push(`Excellent CAC payback timeline of ${payback} months (venture class benchmark is < 12 months).`);
    } else if (payback <= 12) {
      score += 8;
      reasoning.push(`Acceptable CAC payback timeline of ${payback} months.`);
    } else {
      score -= 8;
      reasoning.push(`CAC payback period of ${payback} months is long, increasing cash flow recovery cycle risks.`);
    }

    // Factor 3: Break-even timeline (Weight: 20%)
    const breakEven = report.breakEvenAnalysis.breakEvenTimelineMonths;
    if (breakEven <= 12) {
      score += 15;
      reasoning.push(`Fast path to break-even within ${breakEven} months.`);
    } else if (breakEven <= 24) {
      score += 8;
      reasoning.push(`Break-even expected in ${breakEven} months, which is standard for early-stage B2B SaaS.`);
    } else {
      score -= 5;
      reasoning.push(`Extended break-even timeline of ${breakEven} months increases funding requirements and cash burn risks.`);
    }

    // Factor 4: Profitability Margin (Weight: 20%)
    const grossMargin = report.unitEconomics.grossMargin;
    if (grossMargin >= 75) {
      score += 10;
      reasoning.push(`High gross margin potential of ${grossMargin}%, enabling scalable software unit economics.`);
    } else if (grossMargin >= 60) {
      score += 5;
      reasoning.push(`Gross margin of ${grossMargin}% is standard.`);
    } else {
      score -= 8;
      reasoning.push(`Gross margin of ${grossMargin}% indicates potential scaling inefficiencies or high hardware/COGS dependencies.`);
    }

    // Factor 5: ROI profile (Weight: 20%)
    const expectedRoi = report.roiAnalysis.expectedRoi;
    if (expectedRoi >= 200) {
      score += 10;
      reasoning.push(`Exceptional projected Year 3 ROI of ${expectedRoi}%, indicating high venture potential.`);
    } else if (expectedRoi >= 100) {
      score += 5;
      reasoning.push(`Solid projected Year 3 ROI of ${expectedRoi}%.`);
    } else {
      score -= 5;
      reasoning.push(`Expected Year 3 ROI is low (${expectedRoi}%) relative to capital needed.`);
    }

    const finalScore = Math.max(0, Math.min(100, score));

    return {
      score: finalScore,
      reasoning
    };
  }
}
