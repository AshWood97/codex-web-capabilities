// Pure classification of a CURRENT-TURN DOM/accessibility excerpt supplied by
// the native browser controller. This module never fetches or drives a page.
export function pageEvidence(snapshot:string) {
  const failed=/(?:无法打开|未能显示)\s*(?:深度研究|Deep Research)|无法加载此回复|Unable to (?:open|display|load) (?:Deep Research|this response)|Something went wrong/i.test(snapshot);
  const generating=/button ["“](?:停止|Stop|Stop generating)["”]|ChatGPT 正在回应|Research in progress|正在研究/i.test(snapshot);
  const research=/深度研究|Deep Research/i.test(snapshot);
  const image=/创建图像|Create image|Image created|图像已创建/i.test(snapshot);
  return {phaseHint:failed?'error':generating?'running':'needs_inspection',researchVisible:research,imageVisible:image,complete:false,
    instruction:failed?'Record the current-turn error; do not infer success from a global completion status.': 'Inspect the current-turn body, controls and artifacts. A page-level completion label alone is insufficient.'};
}
