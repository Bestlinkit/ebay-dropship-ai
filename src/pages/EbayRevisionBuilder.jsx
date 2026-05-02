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
  X,
  Save
} from 'lucide-react';
import { cn } from '../lib/utils';
import ebayService from '../services/ebay';

/**
 * 🚀 EBAY REVISION BUILDER (v1.0)
 * Objective: Mirror Listing Builder logic for REVISING existing products.
 */
const EbayRevisionBuilder = () => {
    const { itemId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [activeTab, setActiveTab] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    
    // TABS CONFIG
    const tabs = [
        { id: 1, name: "Title & Description", icon: <Sparkles size={18} /> },
        { id: 2, name: "Pricing & Inventory", icon: <DollarSign size={18} /> },
        { id: 3, name: "Images", icon: <ImageIcon size={18} /> },
        { id: 4, name: "Category", icon: <ShieldCheck size={18} /> },
        { id: 5, name: "Review & Update", icon: <Save size={18} /> },
    ];

    const [selectedTitle, setSelectedTitle] = useState("");
    const [description, setDescription] = useState("");
    const [tags, setTags] = useState([]);
    
    // 💰 PRICING & VARIANTS STATE
    const [variants, setVariants] = useState([]);
    const [bulkPrice, setBulkPrice] = useState("");
    const [bulkInventory, setBulkInventory] = useState("");

    // 🖼️ IMAGES SELECTION STATE
    const [availableImages, setAvailableImages] = useState([]);
    const [selectedImages, setSelectedImages] = useState([]);
    
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);
    const [categoryCache] = useState(new Map());

    // 🏷️ ITEM SPECIFICS STATE
    const [aspects, setAspects] = useState([]);
    const [attributeValues, setAttributeValues] = useState({});
    const [isLoadingAspects, setIsLoadingAspects] = useState(false);
    const [manualCategoryId, setManualCategoryId] = useState("");
    const [pushError, setPushError] = useState(null);
    const [isPushing, setIsPushing] = useState(false);
    const [pushSuccess, setPushSuccess] = useState(false);

    // 📂 CATEGORY STATE
    const [categoryPath, setCategoryPath] = useState([]);
    const [categoryTreeId, setCategoryTreeId] = useState("0");
    const [currentLevelCategories, setCurrentLevelCategories] = useState([]);
    const [isLeafSelected, setIsLeafSelected] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState("");

    // 🔄 FETCH EXISTING PRODUCT DATA
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const item = await ebayService.getProductById(itemId);
                if (item) {
                    setSelectedTitle(item.title || "");
                    setDescription(item.description || "");
                    setSelectedCategoryId(item.categoryId || "");
                    setAvailableImages(item.images || []);
                    setSelectedImages(item.images || []);
                    
                    // Variants (eBay single item price/qty for now)
                    setVariants([{
                        name: "Standard",
                        sku: item.id,
                        cj_price: 0, // We don't have CJ cost for existing eBay items easily
                        ebay_price: item.price || 0,
                        inventory: item.quantity || 1,
                        profit: 0,
                        rio: 0
                    }]);

                    // Initialize attribute values
                    if (item.itemSpecifics?.nameValueList) {
                        const vals = {};
                        item.itemSpecifics.nameValueList.forEach(av => {
                            vals[av.name] = av.value[0];
                        });
                        setAttributeValues(vals);
                    }

                    // If we have categoryId, we might want to try and load aspects
                    if (item.categoryId) {
                        setIsLeafSelected(true);
                        setCategoryPath([{ id: item.categoryId, name: "Current Category" }]);
                        loadItemAspects(item.categoryId);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch eBay item:", err);
                setPushError("Failed to load existing item details from eBay.");
            } finally {
                setIsLoading(false);
            }
        };

        if (itemId) {
            fetchData();
        }
    }, [itemId]);

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
            const val = field === 'inventory' ? (parseInt(value) || 0) : value;
            next[index] = calculateMetrics({ ...next[index], [field]: val });
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

    const handleToggleImage = (url) => {
        setSelectedImages(prev => {
            if (prev.includes(url)) {
                return prev.filter(i => i !== url);
            } else {
                if (prev.length >= 12) return prev;
                return [...prev, url];
            }
        });
    };

    // --- CATEGORY DRILL-DOWN LOGIC (Same as Listing Builder) ---
    useEffect(() => {
        if (activeTab === 4 && categoryPath.length <= 1 && !isLeafSelected) {
            loadInitialCategories();
        }
    }, [activeTab]);

    const loadInitialCategories = async () => {
        setIsLoadingCategories(true);
        try {
            const data = await ebayService.getTopCategories();
            setCategoryTreeId(data.treeId);
            setCurrentLevelCategories(data.children || []);
        } catch (err) {
            console.error("[Category] Root Load Error:", err);
        } finally {
            setIsLoadingCategories(false);
        }
    };

    const handleSelectCategory = async (cat) => {
        setIsLoadingCategories(true);
        try {
            const response = await fetch(`${ebayService.backendUrl}/api/ebay/categories/${cat.id}?treeId=${categoryTreeId}`);
            const data = await response.json();

            setCategoryPath(prev => [...prev.filter(p => p.name !== "Current Category"), { id: data.id, name: data.name }]);

            if (data.leafCategoryTreeNode === true) {
                setIsLeafSelected(true);
                setSelectedCategoryId(data.id);
                setCurrentLevelCategories([]);
                loadItemAspects(data.id);
            } else {
                setIsLeafSelected(false);
                setCurrentLevelCategories(data.children || []);
            }
        } catch (err) {
            console.error("[Category] Fetch failed:", err);
        } finally {
            setIsLoadingCategories(false);
        }
    };

    const loadItemAspects = async (categoryId) => {
        setIsLoadingAspects(true);
        try {
            const data = await ebayService.getItemAspects(categoryId);
            if (Array.isArray(data)) {
                setAspects(data);
            }
        } catch (err) {
            console.error("[Aspects] Failed to load aspects:", err);
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

        try {
            if (!selectedCategoryId) throw new Error("Missing category selection.");
            if (!selectedTitle || selectedTitle.length < 10) throw new Error("Invalid title.");
            if (!selectedImages || selectedImages.length === 0) throw new Error("Missing images.");

            const nameValueList = Object.entries(attributeValues)
                .filter(([name, value]) => value && String(value).trim() !== "")
                .map(([name, value]) => ({
                    name: name,
                    value: [String(value)]
                }));

            if (!attributeValues["Brand"]) {
                nameValueList.push({ name: "Brand", value: ["Unbranded"] });
            }

            const payload = {
                title: selectedTitle,
                description: description,
                categoryId: selectedCategoryId,
                price: variants[0].ebay_price,
                quantity: variants[0].inventory,
                images: selectedImages,
                itemSpecifics: { nameValueList }
            };

            console.info("[eBay Revision] Payload:", payload);
            
            const response = await ebayService.reviseItem(itemId, payload);
            
            if (response.success) {
                setPushSuccess(true);
            } else {
                setPushError(response.error || "eBay rejected the revision.");
            }
        } catch (err) {
            console.error("[Revision Error]", err.message);
            setPushError(err.message);
        } finally {
            setIsPushing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center gap-6 bg-slate-50">
                <RefreshCw size={48} className="text-indigo-500 animate-spin" />
                <h2 className="text-2xl font-black uppercase tracking-tighter italic">Loading Item Details...</h2>
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
                        <h1 className="text-3xl font-black text-slate-950 italic tracking-tighter uppercase leading-none">eBay Revision Builder</h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Update Phase • Item {itemId}</p>
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
                                    <h3 className="text-2xl font-black text-slate-950 italic uppercase tracking-tighter">Content Revision</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Update your item title and description</p>
                                </div>
                            </div>

                            <div className="space-y-12">
                                {/* SELECTED TITLE */}
                                <div className="space-y-6 p-10 bg-slate-50 border border-slate-100 rounded-[2.5rem]">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-slate-400">
                                            <Trophy size={16} className="text-indigo-500" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">eBay Title</span>
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
                                    />
                                </div>

                                {/* DESCRIPTION EDITOR */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-slate-400 px-2">
                                            <Sparkles size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Description</span>
                                        </div>
                                    </div>
                                    
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full h-80 p-8 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] text-sm font-medium text-slate-600 leading-relaxed focus:border-indigo-500 focus:bg-white outline-none transition-all custom-scrollbar whitespace-pre-wrap"
                                    />
                                </div>

                                <div className="pt-10 flex justify-end">
                                    <button onClick={() => setActiveTab(2)} className="px-12 py-5 bg-slate-950 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-4 hover:bg-indigo-600 transition-all shadow-xl group">
                                        Pricing & Inventory <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 2 && (
                        <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-slate-950 italic uppercase tracking-tighter">Pricing & Stock</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Update price and available quantity</p>
                                </div>
                            </div>

                            {/* VARIANT TABLE */}
                            <div className="overflow-hidden border border-slate-100 rounded-[2rem] bg-slate-50/50">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-white border-b border-slate-100">
                                            <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Item / ID</th>
                                            <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">eBay Price</th>
                                            <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Stock</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {variants.map((v, idx) => (
                                            <tr key={idx} className="group hover:bg-white transition-colors">
                                                <td className="px-8 py-6">
                                                    <p className="text-xs font-black text-slate-900 uppercase pr-4">{v.name}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 mt-1">{v.sku}</p>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px]">$</span>
                                                        <input 
                                                            type="number"
                                                            value={v.ebay_price}
                                                            onChange={(e) => handleUpdateVariant(idx, 'ebay_price', e.target.value)}
                                                            className="w-32 pl-6 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-black outline-none focus:border-indigo-500 transition-all"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <input 
                                                        type="number"
                                                        value={v.inventory}
                                                        onChange={(e) => handleUpdateVariant(idx, 'inventory', e.target.value)}
                                                        className="w-24 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-black outline-none focus:border-indigo-500 transition-all"
                                                    />
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
                                    <h3 className="text-2xl font-black text-slate-950 italic uppercase tracking-tighter">Gallery Update</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Update images for your eBay listing</p>
                                </div>
                            </div>

                            {/* IMAGE GRID */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {availableImages.map((img, i) => {
                                    const isSelected = selectedImages.includes(img);
                                    return (
                                        <button 
                                            key={i}
                                            onClick={() => handleToggleImage(img)}
                                            className={cn(
                                                "relative aspect-square rounded-[2rem] overflow-hidden border-4 transition-all group",
                                                isSelected ? "border-slate-950 shadow-2xl scale-[1.02]" : "border-slate-100 hover:border-slate-300"
                                            )}
                                        >
                                            <img src={img} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                                            {isSelected && (
                                                <div className="absolute top-4 right-4 w-8 h-8 bg-slate-950 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-in zoom-in duration-300">
                                                    <CheckCircle2 size={16} />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="pt-10 flex justify-between">
                                <button onClick={() => setActiveTab(2)} className="px-8 py-4 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                                    Back to Pricing
                                </button>
                                <button onClick={() => setActiveTab(4)} className="px-12 py-5 bg-slate-950 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-4 hover:bg-indigo-600 transition-all shadow-xl group">
                                    Category <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 4 && (
                        <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black text-slate-950 italic uppercase tracking-tighter">Category Update</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Change the listing category if necessary</p>
                            </div>

                            <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] space-y-8">
                                {/* Breadcrumbs */}
                                {categoryPath.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-3">
                                        {categoryPath.map((cat, i) => (
                                            <React.Fragment key={cat.id}>
                                                <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-900 shadow-sm flex items-center gap-2">
                                                    <span>{cat.name}</span>
                                                </div>
                                                {i < categoryPath.length - 1 && <ArrowRight size={12} className="text-slate-300" />}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                )}

                                {!isLeafSelected && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
                                        {isLoadingCategories ? (
                                            <div className="col-span-2 text-center py-10">Loading Categories...</div>
                                        ) : (
                                            currentLevelCategories.map(cat => (
                                                <button 
                                                    key={cat.id}
                                                    onClick={() => handleSelectCategory(cat)}
                                                    className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl text-left hover:border-slate-950 transition-all"
                                                >
                                                    <span className="text-[11px] font-bold text-slate-700">{cat.name}</span>
                                                    <ArrowRight size={14} className="text-slate-300" />
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}

                                {isLeafSelected && (
                                    <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                                        <div className="flex items-center gap-4">
                                            <CheckCircle2 size={20} className="text-emerald-500" />
                                            <div>
                                                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Category Selected</p>
                                                <p className="text-xs font-bold text-emerald-900">ID: {selectedCategoryId}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => { setIsLeafSelected(false); setCategoryPath([]); loadInitialCategories(); }} className="text-[10px] font-black text-indigo-600 uppercase">Change</button>
                                    </div>
                                )}
                            </div>

                            <div className="pt-10 flex justify-between">
                                <button onClick={() => setActiveTab(3)} className="px-8 py-4 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                                    Back to Images
                                </button>
                                <button onClick={() => setActiveTab(5)} className="px-12 py-5 bg-slate-950 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-4 hover:bg-emerald-600 transition-all shadow-xl group">
                                    Review & Update <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 5 && (
                        <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black text-slate-950 italic uppercase tracking-tighter">Final Review</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Review your changes before pushing to eBay</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {aspects.map(aspect => (
                                    <div key={aspect.name} className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{aspect.name}</label>
                                        <input 
                                            type="text"
                                            value={attributeValues[aspect.name] || ""}
                                            onChange={(e) => handleAttributeChange(aspect.name, e.target.value)}
                                            className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-bold text-slate-900"
                                        />
                                    </div>
                                ))}
                            </div>

                            {pushError && (
                                <div className="p-6 bg-rose-50 border border-rose-100 rounded-[2rem] flex items-center gap-4 text-rose-600">
                                    <AlertCircle size={20} />
                                    <p className="text-[10px] font-black uppercase tracking-widest">{pushError}</p>
                                </div>
                            )}

                            {pushSuccess && (
                                <div className="p-10 bg-emerald-50 border-2 border-emerald-100 rounded-[3rem] flex flex-col items-center gap-6 text-center">
                                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-emerald-500 shadow-xl shadow-emerald-200/50">
                                        <CheckCircle2 size={40} />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-xl font-black text-emerald-950 uppercase">Item Updated</h4>
                                        <p className="text-sm font-medium text-emerald-600">Your changes have been successfully saved to eBay.</p>
                                    </div>
                                    <button onClick={() => navigate('/products')} className="px-12 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 shadow-xl transition-all">
                                        Back to Inventory
                                    </button>
                                </div>
                            )}

                            {!pushSuccess && (
                                <div className="pt-10 flex justify-between items-center border-t border-slate-100">
                                    <button onClick={() => setActiveTab(4)} className="px-8 py-4 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                                        Back to Category
                                    </button>
                                    
                                    <button 
                                        onClick={handlePushToEbay}
                                        disabled={isPushing}
                                        className="px-16 py-6 bg-slate-950 text-white rounded-[2rem] text-[12px] font-black uppercase tracking-widest flex items-center gap-4 hover:bg-indigo-600 shadow-2xl transition-all"
                                    >
                                        {isPushing ? <RefreshCw size={20} className="animate-spin" /> : <Save size={20} />}
                                        Apply Changes to eBay
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EbayRevisionBuilder;
