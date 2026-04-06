import { useState, useMemo, useRef, ChangeEvent, DragEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Lightbulb, 
  Rocket, 
  Wallet, 
  Star,
  RefreshCcw,
  ArrowRight,
  Info,
  Upload,
  FileText,
  X,
  Beaker
} from 'lucide-react';

type Platform = 'Google Ads' | 'Facebook Ads' | 'Instagram Ads' | 'LinkedIn Ads' | 'Other';

interface CampaignData {
  id?: string;
  name?: string;
  ctr: number;
  cpc: number;
  impressions: number;
  clicks?: number;
  conversions: number;
  revenuePerConversion: number;
  platform: Platform;
}

interface AnalysisResult {
  summary: string;
  metrics: {
    totalClicks: number;
    conversionRate: number;
    totalSpend: number;
    estimatedRoi: number;
  };
  insights: string[];
  problems: string[];
  recommendations: string[];
  budgetStrategy: string;
  abTests: string[];
  chartData: {
    roiData: { name: string; roi: number; fill: string }[];
    platformData: { name: string; value: number; fill: string }[];
    funnelData: { name: string; value: number }[];
  };
  topCampaign?: {
    name: string;
    reason: string;
  };
  score: number;
  scoreJustification: string;
}

export default function App() {
  const [data, setData] = useState<CampaignData>({
    ctr: 2.5,
    cpc: 15,
    impressions: 100000,
    conversions: 150,
    revenuePerConversion: 500,
    platform: 'Google Ads'
  });

  const [uploadedCampaigns, setUploadedCampaigns] = useState<CampaignData[]>([]);
  const [selectedCampaignIndex, setSelectedCampaignIndex] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const calculateAnalysis = (campaigns: CampaignData[]): AnalysisResult => {
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalConversions = 0;
    let totalSpend = 0;
    let totalRevenue = 0;

    const processedCampaigns = campaigns.map(c => {
      const clicks = c.clicks || (c.ctr / 100) * c.impressions;
      const spend = c.cpc * clicks;
      const revenue = c.conversions * c.revenuePerConversion;
      const roi = spend > 0 ? ((revenue - spend) / spend) * 100 : 0;
      const cvr = clicks > 0 ? (c.conversions / clicks) * 100 : 0;
      
      return { ...c, clicks, spend, revenue, roi, cvr };
    });

    processedCampaigns.forEach(c => {
      totalImpressions += c.impressions;
      totalClicks += c.clicks;
      totalConversions += c.conversions;
      totalSpend += c.spend;
      totalRevenue += c.revenue;
    });

    const aggregateCvr = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
    const aggregateRoi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;
    const aggregateCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    const insights: string[] = [];
    const problems: string[] = [];
    const recommendations: string[] = [];
    const abTests: string[] = [];

    // Identify Top Campaign
    let topCampaign = processedCampaigns[0];
    if (processedCampaigns.length > 1) {
      topCampaign = [...processedCampaigns].sort((a, b) => b.roi - a.roi || b.cvr - a.cvr)[0];
    }

    // Benchmarks & Logic
    const isProfitable = aggregateRoi > 0;
    const isHighCPC = (totalSpend / totalClicks) > 20;
    const isLowCTR = aggregateCtr < 1.5;
    const isLowCVR = aggregateCvr < 2;

    if (isProfitable) {
      insights.push(`Overall portfolio is profitable with a ${aggregateRoi.toFixed(1)}% ROI.`);
    } else {
      problems.push(`Negative aggregate ROI (${aggregateRoi.toFixed(1)}%) detected. Spending exceeds revenue.`);
    }

    if (isLowCTR) {
      problems.push(`Low average CTR (${aggregateCtr.toFixed(2)}%) indicates creative fatigue or poor targeting alignment.`);
      recommendations.push("Refresh ad creatives and test high-contrast visuals to improve stopping power.");
      abTests.push("Test 'Benefit-Driven' vs 'Fear-of-Missing-Out' headlines.");
    }

    if (isHighCPC) {
      problems.push(`High average CPC (₹${(totalSpend / totalClicks).toFixed(2)}) is driving up acquisition costs.`);
      recommendations.push("Optimize landing page relevance and quality scores to lower auction bids.");
    }

    if (isLowCVR) {
      problems.push(`Conversion rate (${aggregateCvr.toFixed(2)}%) is below industry standard. Funnel friction likely.`);
      recommendations.push("Audit the mobile checkout/lead flow for technical errors or excessive fields.");
      abTests.push("Test a 'Single-Step' vs 'Multi-Step' conversion process.");
    }

    if (processedCampaigns.length > 1) {
      const worstCampaign = [...processedCampaigns].sort((a, b) => a.roi - b.roi)[0];
      insights.push(`Significant performance variance: '${topCampaign.name}' leads with ${topCampaign.roi.toFixed(0)}% ROI, while '${worstCampaign.name}' is underperforming.`);
    }

    let score = 5;
    if (aggregateRoi > 50) score += 2;
    if (aggregateRoi > 0) score += 1;
    if (aggregateCtr > 2) score += 1;
    if (aggregateCvr > 5) score += 1;
    if (isLowCTR) score -= 1;
    if (!isProfitable) score -= 2;
    score = Math.min(10, Math.max(0, score));

    const summary = score >= 8 
      ? "Strong performance across the board. The funnel is efficient and scaling is recommended."
      : score >= 5 
      ? "Moderate performance with clear optimization opportunities in cost control and creative resonance."
      : "Critical performance issues. The current strategy is unsustainable without immediate funnel intervention.";

    const budgetStrategy = score >= 7 
      ? `Increase budget for '${topCampaign.name}' by 30%. Scale overall spend while maintaining ROI targets.`
      : score >= 4
      ? `Shift 20% of budget from underperforming segments to '${topCampaign.name}' to stabilize aggregate ROI.`
      : "Pause non-performing campaigns immediately. Reallocate remaining budget to high-intent search or retargeting only.";

    // Chart Data Preparation
    const roiData = processedCampaigns.map(c => ({
      name: c.name?.substring(0, 12) || 'Unnamed',
      roi: Math.round(c.roi),
      fill: c.roi >= 0 ? '#4f46e5' : '#ef4444'
    })).slice(0, 6); // Limit to top 6 for readability

    const platformCounts: Record<string, number> = {};
    processedCampaigns.forEach(c => {
      platformCounts[c.platform] = (platformCounts[c.platform] || 0) + 1;
    });
    
    const platformColors: Record<string, string> = {
      'Google Ads': '#4285F4',
      'Facebook Ads': '#1877F2',
      'Instagram Ads': '#E4405F',
      'LinkedIn Ads': '#0A66C2',
      'Other': '#64748b'
    };

    const platformData = Object.entries(platformCounts).map(([name, value]) => ({
      name,
      value,
      fill: platformColors[name] || '#94a3b8'
    }));

    const funnelData = [
      { name: 'Impressions', value: totalImpressions },
      { name: 'Clicks', value: totalClicks },
      { name: 'Conversions', value: totalConversions }
    ];

    return {
      summary,
      metrics: {
        totalClicks,
        conversionRate: aggregateCvr,
        totalSpend,
        estimatedRoi: aggregateRoi
      },
      insights,
      problems,
      recommendations,
      budgetStrategy,
      abTests: abTests.length >= 2 ? abTests.slice(0, 2) : [...abTests, "Test 'Static Image' vs 'Short-form Video' creatives.", "Test 'Free Trial' vs 'Discount Code' offers."],
      chartData: {
        roiData,
        platformData,
        funnelData
      },
      topCampaign: {
        name: topCampaign.name || 'Primary Campaign',
        reason: `Highest ROI (${topCampaign.roi.toFixed(1)}%) and efficient CVR (${topCampaign.cvr.toFixed(1)}%).`
      },
      score,
      scoreJustification: `Based on an aggregate ${aggregateRoi.toFixed(0)}% ROI and ${aggregateCvr.toFixed(1)}% conversion rate.`
    };
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement> | DragEvent) => {
    let file: File | null = null;
    if ('files' in e.target && e.target.files) {
      file = e.target.files[0];
    } else if ('dataTransfer' in e && e.dataTransfer.files) {
      file = e.dataTransfer.files[0];
    }

    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const json = XLSX.utils.sheet_to_json(ws) as any[];

      const mapped = json.map((row, index) => {
        const findCol = (keys: string[]) => {
          const rowKeys = Object.keys(row);
          // 1. Try exact match (case-insensitive)
          const exactMatch = rowKeys.find(k => keys.some(key => k.toLowerCase() === key.toLowerCase()));
          if (exactMatch !== undefined) return row[exactMatch];
          
          // 2. Try partial match
          const partialMatch = rowKeys.find(k => keys.some(key => k.toLowerCase().includes(key.toLowerCase())));
          return partialMatch !== undefined ? row[partialMatch] : null;
        };

        const ctr = parseFloat(findCol(['ctr', 'click through rate', 'click through', 'click-through']) || 0);
        const cpc = parseFloat(findCol(['cpc', 'cost per click', 'cost/click']) || 0);
        const impressions = parseInt(findCol(['impressions', 'impr', 'imps', 'views']) || 0);
        const clicks = parseInt(findCol(['clicks', 'clks', 'total clicks']) || 0);
        const conversions = parseInt(findCol(['conversions', 'conv', 'convs', 'leads', 'sales']) || 0);
        const revenuePerConversion = parseFloat(findCol(['revenue per conversion', 'revenue/conv', 'value per conversion', 'rpc', 'value/conv']) || 500);
        const platformRaw = findCol(['platform', 'network', 'source']) || 'Other';
        const name = findCol(['name', 'campaign', 'ad set', 'title']) || `Campaign ${index + 1}`;

        let platform: Platform = 'Other';
        if (/google/i.test(platformRaw)) platform = 'Google Ads';
        else if (/facebook/i.test(platformRaw)) platform = 'Facebook Ads';
        else if (/instagram/i.test(platformRaw)) platform = 'Instagram Ads';
        else if (/linkedin/i.test(platformRaw)) platform = 'LinkedIn Ads';

        return {
          id: `file-${index}`,
          name,
          ctr,
          cpc,
          impressions,
          clicks: clicks || undefined,
          conversions,
          revenuePerConversion,
          platform
        };
      });

      setUploadedCampaigns(mapped);
      if (mapped.length > 0) {
        setSelectedCampaignIndex(0);
        setData(mapped[0]);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      const campaignsToAnalyze = uploadedCampaigns.length > 0 ? uploadedCampaigns : [data];
      setAnalysis(calculateAnalysis(campaignsToAnalyze));
      setIsAnalyzing(false);
    }, 1200);
  };

  const clearUpload = () => {
    setUploadedCampaigns([]);
    setSelectedCampaignIndex(null);
    setAnalysis(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 bg-indigo-600 rounded-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Ads Analyst</h1>
            </div>
            <p className="text-slate-500">Senior Marketing Performance Analysis Engine</p>
          </div>
          <div className="flex items-center gap-3 text-sm font-medium text-slate-600 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200">
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Live Benchmarks Active
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Input Panel */}
          <div className="lg:col-span-4 space-y-6">
            {/* File Upload Section */}
            <section 
              className={`bg-white p-6 rounded-2xl shadow-sm border-2 border-dashed transition-all ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileUpload(e); }}
            >
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-600" />
                Upload Dataset
              </h2>
              
              {uploadedCampaigns.length === 0 ? (
                <div className="text-center py-4">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer group"
                  >
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-indigo-100 transition-colors">
                      <FileText className="w-6 h-6 text-slate-400 group-hover:text-indigo-600" />
                    </div>
                    <p className="text-sm font-medium text-slate-700">Drop Excel/CSV here</p>
                    <p className="text-xs text-slate-400 mt-1">or click to browse files</p>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileUpload}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-indigo-50 p-2 rounded-lg border border-indigo-100">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="text-xs font-medium text-indigo-900 truncate">
                        {uploadedCampaigns.length} Campaigns Loaded
                      </span>
                    </div>
                    <button onClick={clearUpload} className="p-1 hover:bg-indigo-200 rounded text-indigo-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="max-h-40 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                    {uploadedCampaigns.map((c, i) => (
                      <button
                        key={i}
                        onClick={() => { setSelectedCampaignIndex(i); setData(c); setAnalysis(null); }}
                        className={`w-full text-left p-2 rounded text-xs transition-colors ${selectedCampaignIndex === i ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100 text-slate-600'}`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                {selectedCampaignIndex !== null ? 'Campaign Details' : 'Campaign Input'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Platform</label>
                  <select 
                    className="w-full rounded-lg border-slate-200 bg-slate-50 text-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    value={data.platform}
                    onChange={(e) => setData({...data, platform: e.target.value as Platform})}
                  >
                    <option>Google Ads</option>
                    <option>Facebook Ads</option>
                    <option>Instagram Ads</option>
                    <option>LinkedIn Ads</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5 flex justify-between">
                    CTR (%)
                    <span className="text-indigo-600 font-mono">{data.ctr}%</span>
                  </label>
                  <input 
                    type="range" min="0.1" max="10" step="0.1"
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    value={data.ctr}
                    onChange={(e) => setData({...data, ctr: parseFloat(e.target.value)})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">CPC (₹)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                    <input 
                      type="number"
                      className="w-full pl-8 rounded-lg border-slate-200 bg-slate-50 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                      value={data.cpc}
                      onChange={(e) => setData({...data, cpc: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Impressions</label>
                  <input 
                    type="number"
                    className="w-full rounded-lg border-slate-200 bg-slate-50 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    value={data.impressions}
                    onChange={(e) => setData({...data, impressions: parseInt(e.target.value) || 0})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Conversions</label>
                  <input 
                    type="number"
                    className="w-full rounded-lg border-slate-200 bg-slate-50 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    value={data.conversions}
                    onChange={(e) => setData({...data, conversions: parseInt(e.target.value) || 0})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Revenue per Conv. (₹)</label>
                  <input 
                    type="number"
                    className="w-full rounded-lg border-slate-200 bg-slate-50 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    value={data.revenuePerConversion}
                    onChange={(e) => setData({...data, revenuePerConversion: parseFloat(e.target.value) || 0})}
                  />
                </div>

                <button 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 mt-4"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCcw className="w-5 h-5 animate-spin" />
                      Analyzing Data...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-5 h-5" />
                      Generate Analysis
                    </>
                  )}
                </button>
              </div>
            </section>

            {/* Benchmarks Card */}
            <section className="bg-indigo-900 text-indigo-100 p-6 rounded-2xl shadow-xl">
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Expert Benchmarks
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between border-b border-indigo-800 pb-2">
                  <span>Good CTR</span>
                  <span className="font-mono text-green-400">2% – 5%</span>
                </li>
                <li className="flex justify-between border-b border-indigo-800 pb-2">
                  <span>High CPC</span>
                  <span className="font-mono text-red-400">&gt; ₹20</span>
                </li>
                <li className="flex justify-between">
                  <span>Strong CVR</span>
                  <span className="font-mono text-green-400">&gt; 5%</span>
                </li>
              </ul>
            </section>
          </div>

          {/* Analysis Output */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {!analysis ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="h-full flex flex-col items-center justify-center text-center p-12 bg-white rounded-2xl border-2 border-dashed border-slate-200"
                >
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    <BarChart3 className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">Ready for Analysis</h3>
                  <p className="text-slate-500 max-w-sm">
                    To begin, please <strong>upload a dataset</strong> (Excel/CSV) or <strong>enter metrics manually</strong> in the panel on the left.
                  </p>
                </motion.div>
              ) : (
                <motion.div 
                  key="analysis-result"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  {/* Quick Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                      <p className="text-xs font-medium text-slate-500 uppercase mb-1">Total Clicks</p>
                      <p className="text-xl font-bold text-slate-900">{analysis.metrics.totalClicks.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                      <p className="text-xs font-medium text-slate-500 uppercase mb-1">Conv. Rate</p>
                      <p className="text-xl font-bold text-slate-900">{analysis.metrics.conversionRate.toFixed(2)}%</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                      <p className="text-xs font-medium text-slate-500 uppercase mb-1">Total Spend</p>
                      <p className="text-xl font-bold text-slate-900">₹{analysis.metrics.totalSpend.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                      <p className="text-xs font-medium text-slate-500 uppercase mb-1">Est. ROI</p>
                      <p className={`text-xl font-bold ${analysis.metrics.estimatedRoi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {analysis.metrics.estimatedRoi.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Visual Analytics Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        ROI by Campaign (%)
                      </h3>
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analysis.chartData.roiData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                            <Tooltip 
                              cursor={{ fill: '#f8fafc' }}
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="roi" radius={[4, 4, 0, 0]} barSize={32}>
                              {analysis.chartData.roiData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </section>

                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Platform Distribution
                      </h3>
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={analysis.chartData.platformData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {analysis.chartData.platformData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </section>
                  </div>

                  {/* Funnel Section */}
                  <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <RefreshCcw className="w-4 h-4" />
                      Marketing Funnel (Aggregate)
                    </h3>
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          layout="vertical"
                          data={analysis.chartData.funnelData}
                          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                          <XAxis type="number" hide />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
                          />
                          <Tooltip 
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={24} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </section>

                  {/* Summary Section */}
                  <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-start gap-4 mb-6">
                      <div className="p-3 bg-indigo-50 rounded-xl">
                        <Lightbulb className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-900 mb-1">1. 📊 Overall Performance Summary</h2>
                        <p className="text-slate-600 leading-relaxed">{analysis.summary}</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                      <div>
                        <h3 className="text-sm font-bold text-indigo-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <BarChart3 className="w-4 h-4" />
                          2. 📈 Key Metrics
                        </h3>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                            <span className="text-slate-500">Total Clicks</span>
                            <span className="font-semibold text-slate-900">{analysis.metrics.totalClicks.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                            <span className="text-slate-500">Conversion Rate</span>
                            <span className="font-semibold text-slate-900">{analysis.metrics.conversionRate.toFixed(2)}%</span>
                          </div>
                          <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                            <span className="text-slate-500">Total Spend</span>
                            <span className="font-semibold text-slate-900">₹{analysis.metrics.totalSpend.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Estimated ROI</span>
                            <span className={`font-semibold ${analysis.metrics.estimatedRoi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {analysis.metrics.estimatedRoi.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-indigo-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          3. 🔍 Key Insights
                        </h3>
                        <ul className="space-y-3">
                          {analysis.insights.map((insight, i) => (
                            <li key={i} className="flex gap-3 text-sm text-slate-600">
                              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                              {insight}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </section>

                  {/* Problems & Recommendations */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                      <h3 className="text-lg font-bold text-red-700 mb-4 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        4. ❌ Problems Detected
                      </h3>
                      <ul className="space-y-3">
                        {analysis.problems.map((prob, i) => (
                          <li key={i} className="flex gap-3 text-sm text-slate-600">
                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                            {prob}
                          </li>
                        ))}
                        {analysis.problems.length === 0 && (
                          <li className="text-sm text-slate-400 italic">No critical inefficiencies detected.</li>
                        )}
                      </ul>
                    </section>

                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                      <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                        <Rocket className="w-5 h-5 text-indigo-600" />
                        5. 🚀 Recommendations
                      </h3>
                      <ul className="space-y-3">
                        {analysis.recommendations.map((rec, i) => (
                          <li key={i} className="flex gap-3 text-sm text-slate-600">
                            <ArrowRight className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </section>
                  </div>

                  {/* Budget & A/B Testing */}
                  <div className="grid md:grid-cols-12 gap-6">
                    <section className="md:col-span-7 bg-indigo-600 text-white p-6 rounded-2xl shadow-lg">
                      <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                        <Wallet className="w-5 h-5" />
                        6. 💰 Budget Allocation Strategy
                      </h3>
                      <p className="text-indigo-50 leading-relaxed text-sm">
                        {analysis.budgetStrategy}
                      </p>
                    </section>

                    <section className="md:col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                      <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <Beaker className="w-5 h-5 text-indigo-600" />
                        7. 🧪 A/B Testing Ideas
                      </h3>
                      <ul className="space-y-2">
                        {analysis.abTests.map((test, i) => (
                          <li key={i} className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 italic">
                            "{test}"
                          </li>
                        ))}
                      </ul>
                    </section>
                  </div>

                  {/* Top Campaign */}
                  {analysis.topCampaign && (
                    <div className="flex justify-center">
                      <section className="bg-amber-50 border-2 border-amber-200 px-8 py-6 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center max-w-2xl w-full">
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
                          <h3 className="text-lg font-bold text-amber-900 uppercase tracking-widest">
                            8. 🏆 Top Performing Campaign
                          </h3>
                        </div>
                        <div className="text-2xl font-black text-amber-600 mb-2">
                          {analysis.topCampaign.name}
                        </div>
                        <p className="text-sm text-amber-800 leading-tight">
                          {analysis.topCampaign.reason}
                        </p>
                      </section>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
