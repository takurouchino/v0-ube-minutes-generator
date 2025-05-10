// 工場と部署のマッピング
export const factoryDepartmentMapping: Record<string, string[]> = {
  大阪: ["機能部品事業部", "エラストマー事業部", "生産技術本部"],
  堺: ["機能部品事業部", "品質管理部"],
  吉富: ["機能部品事業部"],
}

// 工場に基づいて利用可能な部署のリストを取得
export function getDepartmentsForFactory(factory: string): string[] {
  return factoryDepartmentMapping[factory] || []
}
