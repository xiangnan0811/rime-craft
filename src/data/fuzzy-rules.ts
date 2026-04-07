export interface FuzzyRuleDefinition {
  id: string;
  label: string;
  description: string;
  category: 'initial' | 'final';
  algebraRules: string[];
}

export const FUZZY_RULE_DEFINITIONS: FuzzyRuleDefinition[] = [
  { id: 'z_zh', label: 'z ↔ zh', description: '平翘舌：子/知不分', category: 'initial', algebraRules: ['derive/^([zcs])h/$1/', 'derive/^([zcs])([^h])/$1h$2/'] },
  { id: 'c_ch', label: 'c ↔ ch', description: '平翘舌：此/吃不分', category: 'initial', algebraRules: ['derive/^([zcs])h/$1/', 'derive/^([zcs])([^h])/$1h$2/'] },
  { id: 's_sh', label: 's ↔ sh', description: '平翘舌：思/诗不分', category: 'initial', algebraRules: ['derive/^([zcs])h/$1/', 'derive/^([zcs])([^h])/$1h$2/'] },
  { id: 'l_n', label: 'l ↔ n', description: '南/兰不分', category: 'initial', algebraRules: ['derive/^l/n/', 'derive/^n/l/'] },
  { id: 'f_h', label: 'f ↔ h', description: '飞/灰不分', category: 'initial', algebraRules: ['derive/^f/h/', 'derive/^h/f/'] },
  { id: 'r_l', label: 'r ↔ l', description: '人/林不分', category: 'initial', algebraRules: ['derive/^r/l/', 'derive/^l/r/'] },
  { id: 'an_ang', label: 'an ↔ ang', description: '前后鼻音：安/昂不分', category: 'final', algebraRules: ['derive/([ei])n$/$1ng/', 'derive/([ei])ng$/$1n/'] },
  { id: 'en_eng', label: 'en ↔ eng', description: '前后鼻音：恩/鞥不分', category: 'final', algebraRules: ['derive/([ei])n$/$1ng/', 'derive/([ei])ng$/$1n/'] },
  { id: 'in_ing', label: 'in ↔ ing', description: '前后鼻音：因/英不分', category: 'final', algebraRules: ['derive/([ei])n$/$1ng/', 'derive/([ei])ng$/$1n/'] },
  { id: 'ian_iang', label: 'ian ↔ iang', description: '前后鼻音：烟/央不分', category: 'final', algebraRules: ['derive/ian$/iang/', 'derive/iang$/ian/'] },
  { id: 'uan_uang', label: 'uan ↔ uang', description: '前后鼻音：弯/王不分', category: 'final', algebraRules: ['derive/uan$/uang/', 'derive/uang$/uan/'] },
]
