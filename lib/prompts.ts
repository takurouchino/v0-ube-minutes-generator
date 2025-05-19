type PromptMapping = {
  [factory: string]: {
    [department: string]: string
  }
}

// 追加指示の定義
const additionalInstruction = "期限や発言者については発言がなかった内容については記載しないでください。"

// チェックリストの定義
const checklistText = `
議事録作成後、以下を確認してください。
[チェックリスト]
①決定事項が明確に書かれているか
②ネクストアクションが明確であるか
③ネクストアクションは誰がいつまでに何を行うかが明確であるか
`

// Define the prompt mappings based on the provided table
const promptMappings: PromptMapping = {
  大阪: {
    機能部品事業部: `以下は会議での発言記録です。発言者と話題ごとに整理し、会議の目的、主要議論点、決定事項、アクションアイテムを含む簡潔な議事録を日本語で作成してください。${additionalInstruction}${checklistText}`,
    エラストマー事業部: `以下の会議ログを、時間順（HH:MM 形式）に並べ替え、各発言を見出しと要約で整理してください。最後に「決定事項」「未解決課題」「次回アクション」をまとめて出力してください。${additionalInstruction}${checklistText}`,
    生産技術本部: `会議の議事録を作成します。議題ごとに「背景」「議論要点」「結論」「担当者と期限」の形式で整理し、「未完了タスク」「フォローアップタスク」を明示した日本語の議事録を生成してください。${additionalInstruction}${checklistText}`,
  },
  堺: {
    機能部品事業部: `以下の会議記録を基に、各ステークホルダー（例：営業部、開発部、経営企画部）ごとに「要望」「懸念点」「合意事項」「次のステップ」を表形式でまとめる議事録を日本語で作成してください。${additionalInstruction}${checklistText}`,
    品質管理部: `以下の会議のトランスクリプトを分析し、「主要リスク」「懸念事項」「対応策案」「担当部門」をピックアップして箇条書きでまとめる、日本語の議事録を生成してください。${additionalInstruction}${checklistText}`,
  },
  吉富: {
    機能部品事業部: `以下の会議記録をもとに、「決定事項」「合意内容」「その理由」「実施スケジュール」を中心に整理した日本語の議事録を作成してください。決定に至らなかった議題は「保留事項」としてまとめてください。${additionalInstruction}${checklistText}`,
  },
}

// Default prompt to use if no specific mapping is found
const defaultPrompt = `以下の会議の文字起こしから重要なポイントを抽出し、簡潔な議事録を作成してください。${additionalInstruction}${checklistText}`

export function getPromptForFactoryAndDepartment(factory: string, department: string): string {
  try {
    // Check if we have a specific prompt for this factory and department
    if (promptMappings[factory] && promptMappings[factory][department]) {
      return promptMappings[factory][department]
    }

    // If no specific mapping is found, return the default prompt
    return defaultPrompt
  } catch (error) {
    console.error("Error getting prompt:", error)
    return defaultPrompt
  }
}
