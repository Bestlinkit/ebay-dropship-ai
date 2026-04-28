import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Sparkles, 
  DollarSign, 
  Image as ImageIcon, 
  Video, 
  ShieldCheck, 
  Send,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Trophy,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { optimizeListing } from '../services/aiOptimization.service';
import ebayService from '../services/ebay';

/**
 * 🚀 EBAY LISTING BUILDER (v1.0)
 * Objective: Optimization + Listing. No sourcing overlap.
 * REAL AI OR FAIL logic implemented in Tab 1.
 */
const EbayListingBuilder = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    // DATA CONTRACT: id, title, description, images[], variants[], price, shipping
    const { product: cjProduct, targetPrice } = location.state || {};

    const [activeTab, setActiveTab] = useState(1);
    
    // TABS CONFIG
    const tabs = [
        { id: 1, name: "Title & Description", icon: <Sparkles size={18} /> },
        { id: 2, name: "Pricing & Variants", icon: <DollarSign size={18} /> },
        { id: 3, name: "Images", icon: <ImageIcon size={18} /> },
        { id: 4, name: "Category & Policies", icon: <ShieldCheck size={18} /> },
        { id: 5, name: "Review & Publish", icon: <Send size={18} /> },
    ];

    const [selectedTitle, setSelectedTitle] = useState(cjProduct?.title || "");
    const [description, setDescription] = useState(cjProduct?.description || "");
    const [tags, setTags] = useState([]);
    const [isOptimizing, setIsOptimizing] = useState(false);

    // 📂 CATEGORY CACHE (Taxonomy Fix)
    const categoryCache = React.useRef(new Map());

    // 💰 PRICING & VARIANTS STATE (TAB 2)
    const [variants, setVariants] = useState([]);
    const [bulkPrice, setBulkPrice] = useState("");
    const [bulkInventory, setBulkInventory] = useState("");

    // 🖼️ IMAGES SELECTION STATE (TAB 3)
    const [availableImages, setAvailableImages] = useState([]);
    const [selectedImages, setSelectedImages] = useState([]);
    
    // 📂 CATEGORY & POLICIES STATE (TAB 4)
    const [categoryPath, setCategoryPath] = useState([]); // Array of {id, name}
    const [categoryTreeId, setCategoryTreeId] = useState("0");
    const [currentLevelCategories, setCurrentLevelCategories] = useState([]);
    const [isLeafSelected, setIsLeafSelected] = useState(false);
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);
    
    const [policies, setPolicies] = useState({ fulfillment: [], payment: [], return: [] });
    const [selectedPolicies, setSelectedPolicies] = useState({ fulfillment: "", payment: "", return: "" });
    const [isLoadingPolicies, setIsLoadingPolicies] = useState(false);
    const [policyError, setPolicyError] = useState(null);

    // 🏷️ ITEM SPECIFICS STATE (TAB 5)
    const [attributeValues, setAttributeValues] = useState({});
    const [isLoadingAspects, setIsLoadingAspects] = useState(false);
    const [manualCategoryId, setManualCategoryId] = useState("");
    const [pushError, setPushError] = useState(null);
    const [isPushing, setIsPushing] = useState(false);
    const [pushSuccess, setPushSuccess] = useState(false);

    // 🛡️ POLICY HELPERS
    const arePoliciesEmpty = policies.fulfillment.length === 0 && policies.payment.length === 0 && policies.return.length === 0;

    // Initialize Variants from CJ Product
    useEffect(() => {
        if (cjProduct?.variants) {
            const initialVariants = cjProduct.variants.map(v => {
                const cjPrice = parseFloat(v.variantSellPrice || v.sellPrice || v.variantPrice || v.price || 0);
                const ebayPrice = targetPrice || (cjPrice * 2); // Default 2x if no target
                
                return calculateMetrics({
                    name: v.variantKey || v.variantStandardEn || v.variantNameEn || "Standard",
                    sku: v.skuCode || v.variantSku || "N/A",
                    cj_price: cjPrice,
                    ebay_price: ebayPrice,
                    inventory: 10
                });
            });
            setVariants(initialVariants);
        }
    }, [cjProduct, targetPrice]);

    // Metric Calculation Logic
    function calculateMetrics(v) {
        const ebayPrice = parseFloat(v.ebay_price) || 0;
        const cjPrice = parseFloat(v.cj_price) || 0;
        const fees = ebayPrice * 0.12;
        const profit = ebayPrice - cjPrice - fees;
        const rio = cjPrice > 0 ? (profit / cjPrice) * 100 : 0;

        return {
            ...v,
            profit: parseFloat(profit.toFixed(2)),
            rio: parseFloat(rio.toFixed(1))
        };
    }

    const handleUpdateVariant = (index, field, value) => {
        setVariants(prev => {
            const next = [...prev];
            next[index] = calculateMetrics({ ...next[index], [field]: value });
            return next;
        });
    };

    const handleApplyBulk = () => {
        setVariants(prev => prev.map(v => calculateMetrics({
            ...v,
            ebay_price: bulkPrice !== "" ? parseFloat(bulkPrice) : v.ebay_price,
            inventory: bulkInventory !== "" ? parseInt(bulkInventory) : v.inventory
        })));
    };

    // Initialize Images
    useEffect(() => {
        if (cjProduct?.images) {
            setAvailableImages(cjProduct.images);
            // Default select: First image + next 4
            setSelectedImages(cjProduct.images.slice(0, 5));
        }
    }, [cjProduct]);

    const handleToggleImage = (url) => {
        setSelectedImages(prev => {
            if (prev.includes(url)) {
                return prev.filter(i => i !== url);
            } else {
                if (prev.length >= 12) return prev; // eBay limit
                return [...prev, url];
            }
        });
    };

    // --- CATEGORY DRILL-DOWN LOGIC ---
    useEffect(() => {
        if (activeTab === 4 && categoryPath.length === 0) {
            loadInitialCategories();
        }
    }, [activeTab]);

    const loadInitialCategories = async (retryCount = 0) => {
        console.log("[Category] Starting Initial Load...");
        setIsLoadingCategories(true);
        try {
            // Check cache first
            if (categoryCache.current.has('root')) {
                setCurrentLevelCategories(categoryCache.current.get('root'));
                setIsLoadingCategories(false);
                return;
            }

            const treeId = await ebayService.getCategoryTreeId();
            setCategoryTreeId(treeId);

            const root = await ebayService.getTopCategories(treeId);
            
            if (!root || root.length === 0) throw new Error("Empty root nodes");

            categoryCache.current.set('root', root);
            setCurrentLevelCategories(root);
        } catch (err) {
            console.error("[Category] Root Load Error:", err);
            if (retryCount < 2) {
                console.log(`[Category] Retrying root load (${retryCount + 1})...`);
                setTimeout(() => loadInitialCategories(retryCount + 1), 1000);
            } else if (categoryCache.current.has('root')) {
                // Fallback to cache even if stale
                setCurrentLevelCategories(categoryCache.current.get('root'));
            }
        } finally {
            setIsLoadingCategories(false);
        }
    };

    const handleSelectCategory = async (cat, retryCount = 0) => {
        console.log("[Category] User Selected:", cat.name, "ID:", cat.id);
        
        // 🛡️ RESET STATE ON CATEGORY CHANGE
        setAttributeValues({});
        setAspects([]);
        setIsLeafSelected(false);

        const newPath = [...categoryPath, cat];
        setCategoryPath(newPath);
        
        if (cat.isLeaf) {
            console.log("[Category] Leaf reached. Selection complete.");
            setIsLeafSelected(true);
            setCurrentLevelCategories([]);
            loadItemAspects(cat.id);
        } else {
            setIsLoadingCategories(true);
            try {
                // Check cache first
                const cacheKey = `sub_${cat.id}`;
                if (categoryCache.current.has(cacheKey)) {
                    const cached = categoryCache.current.get(cacheKey);
                    console.log("[Category] Using Cached Subs:", cached.length);
                    setCurrentLevelCategories(cached);
                    setIsLoadingCategories(false);
                    return;
                }

                console.log("[Category] Fetching Subs from API...");
                const subs = await ebayService.getSubCategories(cat.id, categoryTreeId);
                
                console.log("[Category] API Response Received. Count:", subs?.length || 0);
                
                if (!subs || subs.length === 0) {
                    console.warn("[Category] Received EMPTY sub-categories for parent:", cat.id);
                    // 🚨 NO LONGER THROWING ERROR - Prevent Infinite Loop
                    // Instead, we treat this node as a leaf if no children are found
                    setIsLeafSelected(true);
                    setCurrentLevelCategories([]);
                    loadItemAspects(cat.id);
                } else {
                    categoryCache.current.set(cacheKey, subs);
                    setCurrentLevelCategories(subs);
                }
            } catch (err) {
                console.error("[Category] Sub-node Load Error:", err);
                // 🚨 MAX RETRY = 1 (Requirement)
                if (retryCount < 1) {
                    console.log(`[Category] Retrying sub-category load (Attempt 2)...`);
                    setTimeout(() => handleSelectCategory(cat, retryCount + 1), 1000);
                } else {
                    console.error("[Category] Taxonomy failed after retry. Enabling manual fallback.");
                    setIsLoadingCategories(false);
                }
            } finally {
                setIsLoadingCategories(false);
            }
        }
    };

    // handleRegenerateContent REMOVED - Manual Inputs Only v1.0
    const handleSEOOptimize = () => {
        // Mocked or removed in manual mode
        console.log("SEO Optimization disabled. Manual input mode active.");
    };

    const resetCategory = () => {
        console.log("[Category] Resetting Selection Tree.");
        setCategoryPath([]);
        setIsLeafSelected(false);
        loadInitialCategories();
    };

    // --- POLICY SYNC REMOVED (Legacy Mode Active) ---

    // --- ITEM ASPECTS LOGIC ---
    const loadItemAspects = async (categoryId) => {
        setIsLoadingAspects(true);
        try {
            const data = await ebayService.getItemAspects(categoryId);
            
            // 🛡️ Filter out Size/Color if variants exist (Conflict Prevention)
            const hasVariants = variants.length > 0;
            const filteredData = hasVariants 
                ? data.filter(a => !['Size', 'Color'].includes(a.name))
                : data;

            setAspects(filteredData);
            
            // Initialize required aspects
            const initialValues = {};
            filteredData.forEach(aspect => {
                if (aspect.required && aspect.values?.length > 0) {
                    initialValues[aspect.name] = aspect.values[0];
                }
            });
            setAttributeValues(initialValues);
        } catch (err) {
            console.error("Aspect Load Fault:", err);
        } finally {
            setIsLoadingAspects(false);
        }
    };

    const handleAttributeChange = (name, value) => {
        setAttributeValues(prev => ({ ...prev, [name]: value }));
    };

    const handlePushToEbay = async () => {
        setPushError(null);
        setIsPushing(true);

        // --- 🛡️ PRE-SUBMIT VALIDATION LAYER ---
        const validations = [
            { check: !isLeafSelected, msg: "Category not fully selected." },
            { check: !selectedTitle, msg: "Title is missing." },
            { check: variants.length === 0, msg: "No variants defined." },
            { check: variants.some(v => v.ebay_price <= 0), msg: "Price must be greater than zero." },
            { check: variants.some(v => v.inventory <= 0), msg: "Quantity must be greater than zero." },
            { check: selectedImages.length === 0, msg: "At least one image is required." }
        ];

        // Check required aspects
        aspects.filter(a => a.required).forEach(a => {
            if (!attributeValues[a.name]) {
                validations.push({ check: true, msg: `Missing required aspect: ${a.name}` });
            }
        });

        const error = validations.find(v => v.check);
        if (error) {
            setPushError(`Validation Blocked: ${error.msg}`);
            setIsPushing(false);
            return;
        }

        const leafCategory = categoryPath[categoryPath.length - 1];

        // --- CONSISTENCY ENFORCEMENT & T-SHIRT REPLACEMENT ---
        // 🛡️ STRICT TYPE GUARDS (Requirement 1)
        let cleanTitle = typeof selectedTitle === 'string' ? selectedTitle : String(selectedTitle || "");
        let cleanDescription = typeof description === 'string' ? description : String(description || "");

        // 🛡️ DEFENSIVE FALLBACK (Requirement 4)
        try {
            cleanTitle = cleanTitle.replace(/T-Shirt/gi, "Polo Shirt");
            cleanDescription = cleanDescription.replace(/T-Shirt/gi, "Polo Shirt");
        } catch (e) {
            console.error("[Normalizer] String operation failed, skipping T-Shirt replacement:", e.message);
        }

        // --- VARIATION DATA PREPARATION ---
        const variantSizes = [];
        const variantColors = [];
        
        variants.forEach(v => {
            const parts = v.name.split('-').map(p => p.trim());
            if (parts.length >= 1) variantColors.push(parts[0]);
            if (parts.length >= 2) variantSizes.push(parts[1]);
        });

        const uniqueSizes = [...new Set(variantSizes)].filter(Boolean);
        const uniqueColors = [...new Set(variantColors)].filter(Boolean);

        // --- ITEM SPECIFICS & VARIATION SEPARATION ---
        const finalAttributeValues = { ...attributeValues };

        // 1. HARD BLOCK "Type"
        delete finalAttributeValues["Type"];
        delete finalAttributeValues["type"];

        // 2. FORCE "Size Type" to "Regular" (Taxonomy compliant)
        finalAttributeValues["Size Type"] = "Regular";

        // 3. SEPARATION RULE: If variants exist, REMOVE Size/Color from itemSpecifics
        const hasVariants = variants.length > 0;
        if (hasVariants) {
            delete finalAttributeValues["Size"];
            delete finalAttributeValues["size"];
            delete finalAttributeValues["Color"];
            delete finalAttributeValues["color"];
        }

        // 4. Ensure "Brand" is filled
        if (!finalAttributeValues["Brand"]) finalAttributeValues["Brand"] = "Unbranded";

        // 5. TAXONOMY FILTERING (Whitelisted aspects only)
        const validAspectNames = aspects.map(a => a.name);
        const nameValueList = Object.entries(finalAttributeValues)
            .filter(([name, value]) => validAspectNames.includes(name) && value && String(value).trim() !== "")
            .map(([name, value]) => ({
                name: name,
                value: [String(value)]
            }));

        const itemSpecifics = { nameValueList };

        // 6. VARIATION SPECIFICS SET (The range of available dimensions)
        const variationSpecificsSet = [];
        if (uniqueColors.length > 0) variationSpecificsSet.push({ name: "Color", value: uniqueColors });
        if (uniqueSizes.length > 0) variationSpecificsSet.push({ name: "Size", value: uniqueSizes });

        const payload = {
            title: cleanTitle,
            description: cleanDescription,
            categoryId: categoryPath[categoryPath.length - 1].id,
            price: variants[0]?.ebay_price || 0,
            quantity: variants.reduce((sum, v) => sum + v.inventory, 0),
            images: selectedImages,
            variationSpecificsSet: variationSpecificsSet,
            variants: variants.map(v => {
                const parts = v.name.split('-').map(p => p.trim());
                const specifics = [];
                if (parts[0]) specifics.push({ name: "Color", value: parts[0] });
                if (parts[1]) specifics.push({ name: "Size", value: parts[1] });
                
                return {
                    name: v.name,
                    sku: v.sku,
                    price: v.ebay_price,
                    inventory: v.inventory,
                    specifics: specifics
                };
            }),
            itemSpecifics: itemSpecifics
        };

        try {
            console.info("[eBay Push] SYNCED HANDSHAKE PAYLOAD:");
            console.log(JSON.stringify(payload, null, 2));
            
            const response = await ebayService.publishItem(payload);
            
            if (response.success) {
                setPushSuccess(true);
            } else {
                setPushError(response.error || "Bridge Fault: Sync rejected by eBay.");
            }
        } catch (err) {
            setPushError(`Bridge Fault: ${err.message}`);
        } finally {
            setIsPushing(false);
        }
    };
    const handleRemoveTag = (tagToRemove) => {
        setTags(prev => prev.filter(t => t !== tagToRemove));
    };

    if (!cjProduct) {
        return (
            <div className="h-screen flex flex-col items-center justify-center gap-6 bg-slate-50">
                <AlertCircle size={48} className="text-rose-500" />
                <h2 className="text-2xl font-black uppercase tracking-tighter italic">Handshake Failed</h2>
                <button onClick={() => navigate('/discovery')} className="px-10 py-4 bg-slate-950 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">
                    Back to Discovery
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto px-6 py-12 animate-in fade-in duration-500">
            {/* HEADER */}
            <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate(-1)} className="w-12 h-12 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all bg-white shadow-sm group">
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-950 italic tracking-tighter uppercase leading-none">eBay Listing Builder</h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Optimization Phase • Product {productId}</p>
                    </div>
                </div>
            </div>

            {/* TAB SYSTEM */}
            <div className="grid grid-cols-12 gap-10">
                {/* SIDEBAR NAVIGATION */}
                <div className="col-span-3 space-y-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "w-full flex items-center gap-4 px-6 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all text-left group",
                                activeTab === tab.id 
                                    ? "bg-slate-950 text-white shadow-xl shadow-slate-200 translate-x-2" 
                                    : "bg-white text-slate-400 border border-slate-100 hover:bg-slate-50 hover:text-slate-600"
                            )}
                        >
                            <span className={cn(
                                "transition-colors",
                                activeTab === tab.id ? "text-indigo-400" : "text-slate-300 group-hover:text-slate-400"
                            )}>
                                {tab.icon}
                            </span>
                            {tab.name}
                        </button>
                    ))}
                </div>

                {/* TAB CONTENT AREA */}
                <div className="col-span-9 bg-white border border-slate-200 rounded-[3rem] p-12 min-h-[700px] shadow-sm">
                    {activeTab === 1 && (
                        <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-slate-950 italic uppercase tracking-tighter">Listing Builder</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manual Content Control Mode Active</p>
                                </div>
                            </div>

                            <div className="space-y-12 animate-in fade-in duration-700">
                                {/* CJ PRODUCT REFERENCE DATA */}
                                <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-3xl flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                                            <Sparkles size={20} />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">CJ Product Reference</p>
                                            <p className="text-sm font-bold text-slate-900 truncate max-w-md">{cjProduct?.title}</p>
                                        </div>
                                    </div>
                                    <span className="px-4 py-2 bg-indigo-100 text-indigo-600 rounded-full text-[9px] font-black uppercase">Read-Only Source</span>
                                </div>

                                {/* SELECTED TITLE (MANUAL OVERRIDE) */}
                                <div className="space-y-6 p-10 bg-slate-50 border border-slate-100 rounded-[2.5rem]">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-slate-400">
                                            <Trophy size={16} className="text-indigo-500" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Primary eBay Title</span>
                                        </div>
                                        <div className={cn(
                                            "px-3 py-1 rounded-md text-[9px] font-black uppercase",
                                            selectedTitle.length > 80 ? "bg-rose-100 text-rose-600" : "bg-slate-200 text-slate-600"
                                        )}>
                                            {selectedTitle.length} / 80 CHARS
                                        </div>
                                    </div>
                                    <input 
                                        type="text"
                                        value={selectedTitle}
                                        onChange={(e) => setSelectedTitle(e.target.value)}
                                        className={cn(
                                            "w-full p-6 bg-white border-2 rounded-2xl text-sm font-bold text-slate-900 outline-none transition-all shadow-sm focus:ring-4 ring-indigo-500/5",
                                            selectedTitle.length > 80 ? "border-rose-400" : "border-slate-200 focus:border-slate-950"
                                        )}
                                        placeholder="Enter your custom eBay title here..."
                                    />
                                    {selectedTitle.length > 80 && (
                                        <p className="text-[9px] font-black text-rose-500 uppercase flex items-center gap-2 px-2">
                                            <AlertCircle size={12} /> Title exceeds eBay character limit (80)
                                        </p>
                                    )}
                                </div>

                                {/* DESCRIPTION EDITOR (PLAIN TEXT MODE) */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-slate-400 px-2">
                                            <Sparkles size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Listing Description</span>
                                        </div>
                                        <span className="text-[9px] font-black text-slate-300 uppercase">Raw Text Mode</span>
                                    </div>
                                    
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full h-80 p-8 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] text-sm font-medium text-slate-600 leading-relaxed focus:border-indigo-500 focus:bg-white outline-none transition-all custom-scrollbar whitespace-pre-wrap"
                                        placeholder="Write your listing description here..."
                                    />
                                </div>

                                {/* SEO TAGS (MANUAL ENTRY) */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-slate-400 px-2">
                                            <ImageIcon size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Search Keywords (Tags)</span>
                                        </div>
                                        <span className="text-[9px] font-black text-slate-300 uppercase">{tags.length} TAGS ACTIVE</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-4 px-2">
                                        <input 
                                            type="text"
                                            placeholder="Add tag and press Enter..."
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    const val = e.target.value.trim();
                                                    if (val && !tags.includes(val)) {
                                                        setTags([...tags, val]);
                                                        e.target.value = '';
                                                    }
                                                }
                                            }}
                                            className="flex-1 bg-white border border-slate-200 rounded-xl px-5 py-4 text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 transition-all"
                                        />
                                    </div>

                                    <div className="flex flex-wrap gap-3 px-2">
                                        {tags?.map((tag, i) => (
                                            <div key={i} className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-[10px] font-black text-slate-600 uppercase tracking-tight group hover:border-slate-400 transition-all">
                                                {tag}
                                                <button onClick={() => setTags(tags.filter(t => t !== tag))} className="text-slate-300 hover:text-rose-500 transition-colors">
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                        {tags.length === 0 && (
                                            <p className="text-[10px] font-bold text-slate-300 uppercase italic py-2">No tags added. Type above to start.</p>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-10 flex justify-end">
                                    <button onClick={() => setActiveTab(2)} className="px-12 py-5 bg-slate-950 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-4 hover:bg-indigo-600 transition-all shadow-xl group">
                                        Pricing & Variants <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}


                    {activeTab === 2 && (
                        <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-slate-950 italic uppercase tracking-tighter">Pricing & Inventory</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Adjust margins and stock levels across all variations</p>
                                </div>
                                {targetPrice && (
                                    <div className="px-5 py-2.5 bg-indigo-50 border border-indigo-100 rounded-xl">
                                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Suggested Market Price</p>
                                        <p className="text-sm font-black text-indigo-600">${parseFloat(targetPrice).toFixed(2)}</p>
                                    </div>
                                )}
                            </div>

                            {/* BULK ACTIONS BAR */}
                            <div className="p-8 bg-slate-950 rounded-[2.5rem] shadow-xl shadow-slate-200">
                                <div className="flex items-end gap-6">
                                    <div className="flex-1 space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bulk eBay Price ($)</label>
                                        <input 
                                            type="number"
                                            value={bulkPrice}
                                            onChange={(e) => setBulkPrice(e.target.value)}
                                            placeholder="Set all prices..."
                                            className="w-full bg-slate-900 border-none rounded-xl px-5 py-4 text-white text-sm font-bold focus:ring-2 ring-indigo-500/50 outline-none"
                                        />
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bulk Inventory</label>
                                        <input 
                                            type="number"
                                            value={bulkInventory}
                                            onChange={(e) => setBulkInventory(e.target.value)}
                                            placeholder="Set all stock..."
                                            className="w-full bg-slate-900 border-none rounded-xl px-5 py-4 text-white text-sm font-bold focus:ring-2 ring-indigo-500/50 outline-none"
                                        />
                                    </div>
                                    <button 
                                        onClick={handleApplyBulk}
                                        className="px-10 py-4 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg active:scale-95"
                                    >
                                        Apply to All
                                    </button>
                                </div>
                            </div>

                            {/* VARIANT TABLE */}
                            <div className="overflow-hidden border border-slate-100 rounded-[2rem] bg-slate-50/50">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-white border-b border-slate-100">
                                            <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Variant / SKU</th>
                                            <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">CJ Cost</th>
                                            <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">eBay Price</th>
                                            <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Stock</th>
                                            <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Profit</th>
                                            <th className="px-8 py-5 text-right text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">ROI %</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {variants.map((v, idx) => (
                                            <tr key={idx} className="group hover:bg-white transition-colors">
                                                <td className="px-8 py-6">
                                                    <p className="text-xs font-black text-slate-900 uppercase pr-4">{v.name}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 mt-1">{v.sku}</p>
                                                </td>
                                                <td className="px-6 py-6 text-xs font-bold text-slate-500">
                                                    ${v.cj_price.toFixed(2)}
                                                </td>
                                                <td className="px-6 py-6">
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px]">$</span>
                                                        <input 
                                                            type="number"
                                                            value={v.ebay_price}
                                                            onChange={(e) => handleUpdateVariant(idx, 'ebay_price', e.target.value)}
                                                            className={cn(
                                                                "w-24 pl-6 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-black outline-none focus:border-indigo-500 transition-all",
                                                                v.ebay_price < v.cj_price && "border-rose-300 bg-rose-50 text-rose-600"
                                                            )}
                                                        />
                                                    </div>
                                                    {v.ebay_price < v.cj_price && (
                                                        <p className="text-[8px] font-black text-rose-500 uppercase mt-1">Loss Warning</p>
                                                    )}
                                                </td>
                                                <td className="px-6 py-6">
                                                    <input 
                                                        type="number"
                                                        value={v.inventory}
                                                        onChange={(e) => handleUpdateVariant(idx, 'inventory', e.target.value)}
                                                        className="w-20 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-black outline-none focus:border-indigo-500 transition-all"
                                                    />
                                                </td>
                                                <td className="px-6 py-6">
                                                    <span className={cn(
                                                        "text-xs font-black",
                                                        v.profit < 0 ? "text-rose-600" : "text-slate-900"
                                                    )}>
                                                        ${v.profit.toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <span className={cn(
                                                        "px-3 py-1 rounded-full text-[10px] font-black",
                                                        v.rio > 50 ? "bg-emerald-100 text-emerald-700" : 
                                                        v.rio < 0 ? "bg-rose-100 text-rose-700" : 
                                                        "bg-slate-100 text-slate-600"
                                                    )}>
                                                        {v.cj_price > 0 ? `${v.rio}%` : "N/A"}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="pt-10 flex justify-between">
                                <button onClick={() => setActiveTab(1)} className="px-8 py-4 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                                    Back to Title
                                </button>
                                <button onClick={() => setActiveTab(3)} className="px-12 py-5 bg-slate-950 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-4 hover:bg-indigo-600 transition-all shadow-xl group">
                                    Images <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 3 && (
                        <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-slate-950 italic uppercase tracking-tighter">Images Selection</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select up to 12 images for your eBay gallery</p>
                                </div>
                                <div className={cn(
                                    "px-6 py-3 rounded-2xl flex items-center gap-3 border-2 transition-all",
                                    selectedImages.length === 0 ? "bg-rose-50 border-rose-100 text-rose-500" : "bg-slate-50 border-slate-100 text-slate-900"
                                )}>
                                    <span className="text-[10px] font-black uppercase tracking-widest">Selected</span>
                                    <span className="text-sm font-black">{selectedImages.length} / 12</span>
                                </div>
                            </div>

                            {selectedImages.length === 0 && (
                                <div className="p-6 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-4 text-rose-600 animate-bounce">
                                    <AlertCircle size={20} />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Please select at least one product image to continue</p>
                                </div>
                            )}

                            {/* IMAGE GRID */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {availableImages.map((img, i) => {
                                    const isSelected = selectedImages.includes(img);
                                    const selectIndex = selectedImages.indexOf(img);
                                    
                                    return (
                                        <button 
                                            key={i}
                                            onClick={() => handleToggleImage(img)}
                                            className={cn(
                                                "relative aspect-square rounded-[2rem] overflow-hidden border-4 transition-all group",
                                                isSelected ? "border-slate-950 shadow-2xl scale-[1.02]" : "border-slate-100 hover:border-slate-300"
                                            )}
                                        >
                                            <img 
                                                src={img} 
                                                className={cn(
                                                    "w-full h-full object-cover transition-transform duration-500",
                                                    isSelected ? "scale-105" : "group-hover:scale-105"
                                                )} 
                                                alt="" 
                                                referrerPolicy="no-referrer"
                                            />
                                            
                                            {/* SELECTION OVERLAY */}
                                            <div className={cn(
                                                "absolute inset-0 bg-slate-950/20 transition-opacity",
                                                isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                            )} />

                                            {isSelected && (
                                                <div className="absolute top-4 right-4 w-8 h-8 bg-slate-950 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-in zoom-in duration-300">
                                                    <CheckCircle2 size={16} />
                                                </div>
                                            )}

                                            {isSelected && (
                                                <div className="absolute bottom-4 left-4 px-3 py-1 bg-white/90 backdrop-blur-md rounded-lg shadow-sm border border-slate-200">
                                                    <p className="text-[9px] font-black text-slate-950 uppercase tracking-tighter">
                                                        {selectIndex === 0 ? "Main Image" : `Position ${selectIndex + 1}`}
                                                    </p>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {availableImages.length === 0 && (
                                <div className="py-32 flex flex-col items-center justify-center gap-6 border-2 border-dashed border-slate-100 rounded-[3rem]">
                                    <ImageIcon size={48} className="text-slate-200" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No images found for this product</p>
                                </div>
                            )}

                            <div className="pt-10 flex justify-between">
                                <button onClick={() => setActiveTab(2)} className="px-8 py-4 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                                    Back to Pricing
                                </button>
                                <button 
                                    disabled={selectedImages.length === 0}
                                    onClick={() => setActiveTab(4)} 
                                    className={cn(
                                        "px-12 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-4 transition-all shadow-xl group",
                                        selectedImages.length === 0 
                                            ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                                            : "bg-slate-950 text-white hover:bg-indigo-600"
                                    )}
                                >
                                    Category & Policies <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 4 && (
                        <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black text-slate-950 italic uppercase tracking-tighter">Category & Policies</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select target market and store policies</p>
                            </div>

                            {/* HIERARCHICAL CATEGORY SELECTION */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-3 text-slate-400">
                                        <ShieldCheck size={16} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">eBay Taxonomy Drill-Down</span>
                                    </div>
                                    {categoryPath.length > 0 && (
                                        <button onClick={resetCategory} className="text-[9px] font-black text-rose-500 uppercase hover:underline">Reset Selection</button>
                                    )}
                                </div>

                                <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] space-y-8">
                                    {/* Breadcrumbs */}
                                    {categoryPath.length > 0 && (
                                        <div className="flex flex-wrap items-center gap-3">
                                            {categoryPath.map((cat, i) => (
                                                <React.Fragment key={cat.id}>
                                                    <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-900 shadow-sm flex items-center gap-2">
                                                        <span>{cat.name}</span>
                                                        <span className="text-[9px] text-slate-400">({cat.id})</span>
                                                    </div>
                                                    {i < categoryPath.length - 1 && <ArrowRight size={12} className="text-slate-300" />}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    )}

                                    {/* Category Grid */}
                                    {!isLeafSelected && currentLevelCategories.length > 0 && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                            {isLoadingCategories ? (
                                                Array(6).fill(0).map((_, i) => <div key={i} className="h-12 bg-white animate-pulse rounded-xl" />)
                                            ) : (
                                                currentLevelCategories.map(cat => (
                                                    <button 
                                                        key={cat.id}
                                                        onClick={() => handleSelectCategory(cat)}
                                                        className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl text-left hover:border-slate-950 transition-all group"
                                                    >
                                                        <span className="text-[11px] font-bold text-slate-700">{cat.name}</span>
                                                        {!cat.isLeaf && <ArrowRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-transform" />}
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}

                                    {/* MANUAL CATEGORY FALLBACK (Requirement 4) */}
                                    {!isLeafSelected && !isLoadingCategories && currentLevelCategories.length === 0 && (
                                        <div className="p-8 bg-rose-50 border border-rose-100 rounded-[2rem] space-y-6">
                                            <div className="flex items-center gap-4 text-rose-600">
                                                <AlertCircle size={24} />
                                                <div className="space-y-1">
                                                    <p className="text-sm font-black uppercase">Taxonomy Navigation Halt</p>
                                                    <p className="text-xs font-medium text-rose-500">eBay returned no sub-categories for this path. You can manually enter the target Category ID below to proceed.</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-4">
                                                <input 
                                                    type="text"
                                                    value={manualCategoryId}
                                                    onChange={(e) => setManualCategoryId(e.target.value)}
                                                    placeholder="Enter eBay Category ID..."
                                                    className="flex-1 bg-white border-2 border-rose-100 rounded-xl px-6 py-4 text-sm font-bold outline-none focus:border-rose-400"
                                                />
                                                <button 
                                                    onClick={() => {
                                                        if (manualCategoryId) {
                                                            handleSelectCategory({ id: manualCategoryId, name: `Manual Input`, isLeaf: true });
                                                        }
                                                    }}
                                                    className="px-10 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg"
                                                >
                                                    Inject ID
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {isLeafSelected && (
                                        <div className="flex items-center gap-4 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                                            <CheckCircle2 size={20} className="text-emerald-500" />
                                            <div>
                                                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Category Locked & Ready</p>
                                                <p className="text-xs font-bold text-emerald-900">Final ID: {categoryPath[categoryPath.length-1].id}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-10 flex justify-between">
                                <button onClick={() => setActiveTab(3)} className="px-8 py-4 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                                    Back to Images
                                </button>
                                <button 
                                    disabled={!isLeafSelected}
                                    onClick={() => setActiveTab(5)} 
                                    className={cn(
                                        "px-12 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-4 transition-all shadow-xl group",
                                        (!isLeafSelected)
                                            ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                                            : "bg-slate-950 text-white hover:bg-emerald-600"
                                    )}
                                >
                                    Item Specifics <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 5 && (
                        <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black text-slate-950 italic uppercase tracking-tighter">Final Specifications</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Complete required item specifics for the selected category</p>
                            </div>

                            {/* ITEM SPECIFICS / ATTRIBUTES */}
                            <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {isLoadingAspects ? (
                                        Array(6).fill(0).map((_, i) => <div key={i} className="h-20 bg-slate-50 animate-pulse rounded-2xl" />)
                                    ) : (
                                        aspects.map(aspect => (
                                            <div key={aspect.name} className="space-y-3">
                                                <div className="flex items-center justify-between px-1">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                        {aspect.name} 
                                                        {aspect.required && <span className="text-rose-500 ml-1">*</span>}
                                                    </label>
                                                    {aspect.required && (
                                                        <span className="text-[8px] font-black bg-rose-50 text-rose-500 px-2 py-0.5 rounded-full uppercase">Required</span>
                                                    )}
                                                </div>
                                                <div className="relative">
                                                    {aspect.values?.length > 0 ? (
                                                        <select 
                                                            value={attributeValues[aspect.name] || ""}
                                                            onChange={(e) => handleAttributeChange(aspect.name, e.target.value)}
                                                            className={cn(
                                                                "w-full p-5 bg-slate-50 border-2 rounded-2xl text-xs font-bold text-slate-900 outline-none transition-all shadow-sm",
                                                                aspect.required && !attributeValues[aspect.name] ? "border-rose-100 ring-4 ring-rose-500/5" : "border-slate-100 focus:border-slate-950"
                                                            )}
                                                        >
                                                            <option value="">Select Allowed Value...</option>
                                                            {aspect.values.map(val => <option key={val} value={val}>{val}</option>)}
                                                        </select>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            <input 
                                                                type="text"
                                                                value={attributeValues[aspect.name] || ""}
                                                                onChange={(e) => handleAttributeChange(aspect.name, e.target.value)}
                                                                className={cn(
                                                                    "w-full p-5 bg-slate-50 border-2 rounded-2xl text-xs font-bold text-slate-900 outline-none transition-all shadow-sm",
                                                                    aspect.required && !attributeValues[aspect.name] ? "border-rose-100 ring-4 ring-rose-500/5" : "border-slate-100 focus:border-slate-950"
                                                                )}
                                                                placeholder={aspect.required ? `Enter Required ${aspect.name}...` : `Enter ${aspect.name}...`}
                                                            />
                                                            <p className="text-[8px] font-bold text-slate-400 uppercase px-2 italic">Note: No restricted values provided by eBay Taxonomy</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* PUSH STATUS */}
                            {pushError && (
                                <div className="p-6 bg-rose-50 border border-rose-100 rounded-[2rem] flex items-center gap-4 text-rose-600">
                                    <AlertCircle size={20} />
                                    <p className="text-[10px] font-black uppercase tracking-widest">{pushError}</p>
                                </div>
                            )}

                            {pushSuccess && (
                                <div className="p-10 bg-emerald-50 border-2 border-emerald-100 rounded-[3rem] flex flex-col items-center gap-6 text-center">
                                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-emerald-500 shadow-xl shadow-emerald-200/50 animate-bounce">
                                        <CheckCircle2 size={40} />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-xl font-black text-emerald-950 uppercase">Listing Live on eBay</h4>
                                        <p className="text-sm font-medium text-emerald-600">Product has been successfully synchronized and published.</p>
                                    </div>
                                    <button onClick={() => navigate('/products')} className="px-12 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 shadow-xl transition-all">
                                        View in Products
                                    </button>
                                </div>
                            )}

                            {!pushSuccess && (
                                <div className="pt-10 flex justify-between items-center border-t border-slate-100">
                                    <button onClick={() => setActiveTab(4)} className="px-8 py-4 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                                        Back to Categories
                                    </button>
                                    
                                    <div className="flex items-center gap-8">
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ready for Handshake</p>
                                            <p className="text-xs font-black text-slate-900">{variants.length} Variations • {selectedImages.length} Images</p>
                                        </div>
                                        <button 
                                            onClick={handlePushToEbay}
                                            disabled={isPushing}
                                            className={cn(
                                                "px-16 py-6 rounded-[2rem] text-[12px] font-black uppercase tracking-widest flex items-center gap-4 transition-all shadow-2xl",
                                                (isPushing) ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-slate-950 text-white hover:bg-emerald-600 hover:scale-105 active:scale-95"
                                            )}
                                        >
                                            {isPushing ? (
                                                <RefreshCw size={20} className="animate-spin" />
                                            ) : (
                                                <Send size={20} />
                                            )}
                                            Push to eBay Production
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EbayListingBuilder;
