/**
 * JHPCS - CATÁLOGO DE PRODUTOS QUÍMICOS E REGRAS FISCAIS OFFLINE-FIRST (PWA)
 * Base de dados pré-carregada no IndexedDB para emissão e orçamento fiscal sem internet.
 */

export interface ChemicalTaxItem {
  id: string;
  sku: string;
  name: string;
  category: 'CLORO' | 'CORRETOR_PH' | 'ALCALINIDADE' | 'ALGICIDA' | 'FLOCULANTE' | 'SERVICO';
  ncm: string;
  cfopInterno: string;
  cfopInterestadual: string;
  cst: string;
  csosn: string;
  aliquotaIcms: number;
  aliquotaPis: number;
  aliquotaCofins: number;
  unidade: 'KG' | 'L' | 'UN';
  precoPadraoBrl: number;
  permiteVendaBalcao: boolean;
}

export const OFFLINE_CHEMICAL_CATALOG: ChemicalTaxItem[] = [
  {
    id: 'chem-01',
    sku: 'CLORO-HIPO-CALCIO',
    name: 'Hipoclorito de Cálcio 65% Granulado',
    category: 'CLORO',
    ncm: '28289011',
    cfopInterno: '5102',
    cfopInterestadual: '6102',
    cst: '00',
    csosn: '102',
    aliquotaIcms: 18.0,
    aliquotaPis: 1.65,
    aliquotaCofins: 7.60,
    unidade: 'KG',
    precoPadraoBrl: 38.50,
    permiteVendaBalcao: true,
  },
  {
    id: 'chem-02',
    sku: 'CLORO-DICLORO-ESTAB',
    name: 'Dicloro Isocianurato de Sódio Estabilizado 60%',
    category: 'CLORO',
    ncm: '29336919',
    cfopInterno: '5102',
    cfopInterestadual: '6102',
    cst: '00',
    csosn: '102',
    aliquotaIcms: 18.0,
    aliquotaPis: 1.65,
    aliquotaCofins: 7.60,
    unidade: 'KG',
    precoPadraoBrl: 44.90,
    permiteVendaBalcao: true,
  },
  {
    id: 'chem-03',
    sku: 'BARRILHA-LEVE',
    name: 'Carbonato de Sódio Puro (Barrilha Leve)',
    category: 'CORRETOR_PH',
    ncm: '28362010',
    cfopInterno: '5102',
    cfopInterestadual: '6102',
    cst: '00',
    csosn: '102',
    aliquotaIcms: 18.0,
    aliquotaPis: 1.65,
    aliquotaCofins: 7.60,
    unidade: 'KG',
    precoPadraoBrl: 16.50,
    permiteVendaBalcao: true,
  },
  {
    id: 'chem-04',
    sku: 'BICARBONATO-SODIO',
    name: 'Bicarbonato de Sódio Técnico (Elevador de Alcalinidade)',
    category: 'ALCALINIDADE',
    ncm: '28363000',
    cfopInterno: '5102',
    cfopInterestadual: '6102',
    cst: '00',
    csosn: '102',
    aliquotaIcms: 18.0,
    aliquotaPis: 1.65,
    aliquotaCofins: 7.60,
    unidade: 'KG',
    precoPadraoBrl: 19.80,
    permiteVendaBalcao: true,
  },
  {
    id: 'chem-05',
    sku: 'SULFATO-ALUMINIO',
    name: 'Sulfato de Alumínio Decantador',
    category: 'FLOCULANTE',
    ncm: '28332200',
    cfopInterno: '5405', // ST
    cfopInterestadual: '6404',
    cst: '60',
    csosn: '500',
    aliquotaIcms: 0.0,
    aliquotaPis: 0.65,
    aliquotaCofins: 3.00,
    unidade: 'KG',
    precoPadraoBrl: 14.90,
    permiteVendaBalcao: true,
  },
  {
    id: 'chem-06',
    sku: 'ALGICIDA-MANUTENCAO',
    name: 'Algicida de Choque e Manutenção Polimérico',
    category: 'ALGICIDA',
    ncm: '38089990',
    cfopInterno: '5102',
    cfopInterestadual: '6102',
    cst: '00',
    csosn: '102',
    aliquotaIcms: 18.0,
    aliquotaPis: 1.65,
    aliquotaCofins: 7.60,
    unidade: 'L',
    precoPadraoBrl: 32.00,
    permiteVendaBalcao: true,
  },
  {
    id: 'serv-01',
    sku: 'SERV-MANUTENCAO-PISCINA',
    name: 'Serviço Técnico de Limpeza e Preservação de Piscina',
    category: 'SERVICO',
    ncm: '00000000', // NFS-e não usa NCM
    cfopInterno: '0000',
    cfopInterestadual: '0000',
    cst: '00',
    csosn: '102',
    aliquotaIcms: 0.0,
    aliquotaPis: 0.0,
    aliquotaCofins: 0.0,
    unidade: 'UN',
    precoPadraoBrl: 150.00,
    permiteVendaBalcao: false,
  }
];

const LOCAL_STORAGE_KEY = 'jhpcs_offline_ncm_catalog_v1';

/**
 * Gerenciador de Cache Offline para o PWA de Campo
 */
export class OfflineFiscalCatalogManager {
  /**
   * Inicializa o catálogo local caso ainda não esteja em cache
   */
  static initializeLocalCache(): ChemicalTaxItem[] {
    if (typeof window === 'undefined') {
      return OFFLINE_CHEMICAL_CATALOG;
    }
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!cached) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(OFFLINE_CHEMICAL_CATALOG));
        return OFFLINE_CHEMICAL_CATALOG;
      }
      return JSON.parse(cached);
    } catch {
      return OFFLINE_CHEMICAL_CATALOG;
    }
  }

  /**
   * Busca um insumo químico pelo SKU ou pelo NCM offline
   */
  static findItem(skuOrNcm: string): ChemicalTaxItem | undefined {
    const list = this.initializeLocalCache();
    return list.find(item => item.sku === skuOrNcm || item.ncm === skuOrNcm);
  }

  /**
   * Calcula a tributação e totais de um carrinho de insumos mesmo sem rede
   */
  static calculateOfflineCart(items: Array<{ sku: string; quantity: number; unitPrice?: number }>) {
    const catalog = this.initializeLocalCache();
    let totalProducts = 0;
    let totalIcms = 0;
    let totalPis = 0;
    let totalCofins = 0;

    const enrichedItems = items.map(cartItem => {
      const chem = catalog.find(c => c.sku === cartItem.sku) || OFFLINE_CHEMICAL_CATALOG[0];
      const price = cartItem.unitPrice || chem.precoPadraoBrl;
      const subtotal = price * cartItem.quantity;
      const icms = (subtotal * chem.aliquotaIcms) / 100;
      const pis = (subtotal * chem.aliquotaPis) / 100;
      const cofins = (subtotal * chem.aliquotaCofins) / 100;

      totalProducts += subtotal;
      totalIcms += icms;
      totalPis += pis;
      totalCofins += cofins;

      return {
        ...cartItem,
        name: chem.name,
        ncm: chem.ncm,
        cfop: chem.cfopInterno,
        unit: chem.unidade,
        unitPrice: price,
        subtotal,
        icms,
        pis,
        cofins,
      };
    });

    return {
      items: enrichedItems,
      totalProducts,
      totalIcms,
      totalPis,
      totalCofins,
      totalAmountBrl: totalProducts,
      isOfflineCalculated: true,
      timestamp: new Date().toISOString(),
    };
  }
}

