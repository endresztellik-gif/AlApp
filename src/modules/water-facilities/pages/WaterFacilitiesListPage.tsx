import { useState } from 'react';
import { useWaterFacilities } from '../hooks/useWaterFacilities';
import { WaterFacilityForm } from '../components/WaterFacilityForm';
import { WaterFacilityInput } from '../types';
import { Plus, Search, Filter, Droplets } from 'lucide-react';
import { Link } from 'react-router-dom';
import { googleStorage } from '@/core/api/google-services';

export function WaterFacilitiesListPage() {
    const { facilities, isLoading, createFacility } = useWaterFacilities();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredFacilities = facilities?.filter(f =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.permit_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCreate = async (data: WaterFacilityInput, file?: File) => {
        try {
            const newFacilityData = { ...data };
            if (file) {
                const driveFile = await googleStorage.uploadFile(
                    file,
                    data.name || 'water-facility',
                    'water-facilities/permits'
                );
                newFacilityData.permit_file_path = driveFile.webViewLink;
            }
            await createFacility(newFacilityData);
            setIsFormOpen(false);
        } catch (error) {
            console.error("Create failed", error);
        }
    };

    return (
        <div className="pb-20 space-y-6 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-1">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
                        <div className="p-2 bg-primary-100 rounded-lg">
                            <Droplets className="w-6 h-6 text-primary-600" />
                        </div>
                        Vízi Létesítmények
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1 ml-12">
                        Kutak, tározók és egyéb vízi objektumok nyilvántartása
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-all shadow-sm active:scale-95"
                    >
                        <Plus className="w-4.5 h-4.5" />
                        Új Létesítmény
                    </button>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Keresés név vagy engedélyszám alapján..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all shadow-sm"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-border text-text-secondary text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
                    <Filter className="w-4 h-4" />
                    Szűrők
                </button>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-40 bg-white rounded-2xl animate-pulse shadow-sm border border-border"></div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-border">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-text-secondary">Név</th>
                                    <th className="px-6 py-4 font-semibold text-text-secondary">Engedély Száma</th>
                                    <th className="px-6 py-4 font-semibold text-text-secondary">Hatóság</th>
                                    <th className="px-6 py-4 font-semibold text-text-secondary">Érvényesség</th>
                                    <th className="px-6 py-4 font-semibold text-text-secondary text-right">Műveletek</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredFacilities?.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                                                    <Droplets className="w-6 h-6 text-muted-foreground" />
                                                </div>
                                                <p className="font-medium text-text-primary">Nincs találat</p>
                                                <p className="text-sm">Próbálj módosítani a keresésen vagy adj hozzá új létesítményt.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredFacilities?.map((facility) => (
                                        <tr key={facility.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4 font-medium text-text-primary">
                                                {facility.name}
                                            </td>
                                            <td className="px-6 py-4 text-text-secondary">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    {facility.permit_number || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-text-secondary">{facility.authority || '-'}</td>
                                            <td className="px-6 py-4 text-text-secondary">
                                                {facility.permit_expiry_date ? (
                                                    new Date(facility.permit_expiry_date).toLocaleDateString('hu-HU')
                                                ) : (
                                                    '-'
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link
                                                    to={`/water-facilities/${facility.id}`}
                                                    className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                                                >
                                                    Részletek
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <WaterFacilityForm
                key={isFormOpen ? 'open' : 'closed'}
                isOpen={isFormOpen}
                onCancel={() => setIsFormOpen(false)}
                onSave={handleCreate}
            />
        </div>
    );
}
