import { App, Checkbox, Empty, Input, Space, Tag } from 'antd';
import { useMemoizedFn, useReactive, useRequest } from 'ahooks';

import { createNamingGroupList } from './namingGroupList';
import styles from './index.module.less';

const { TextArea } = Input;

const GOOGLE_TRANSLATE_API_KEY = import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY;
const DEFAULT_LANGUAGE_LIST = ['JS', 'Java'];
const COMMON_NOUN_LIST = [
  '用户',
  '商家',
  '角色',
  '权限',
  '菜单',
  '订单',
  '商品',
  '店铺',
  '员工',
  '部门',
  '组织',
  '客户',
  '会员',
  '账户',
  '地址',
  '分类',
  '标签',
  '评论',
  '文章',
  '消息',
  '通知',
  '支付',
  '退款',
  '优惠券',
  '库存',
  '物流',
  '审批',
  '配置',
  '日志',
  '任务',
];

// 拆分英文单词
const splitWords = (text) =>
  text
    .replace(/['’]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

// 首字母大写
const capitalizeWord = (word) => {
  const lowerWord = word.toLowerCase();

  return `${lowerWord.charAt(0).toUpperCase()}${lowerWord.slice(1)}`;
};

// 转小写驼峰
const toCamelCase = (text) => {
  const words = splitWords(text);

  // 空文本边界
  if (words.length === 0) {
    return '';
  }

  const [firstWord, ...restWords] = words;
  const headWord = firstWord.toLowerCase();
  const tailWords = restWords.map(capitalizeWord).join('');

  return `${headWord}${tailWords}`;
};

// 转大写驼峰
const toPascalCase = (text) => splitWords(text).map(capitalizeWord).join('');

// 转短横线
const toKebabCase = (text) => splitWords(text).map((word) => word.toLowerCase()).join('-');

// 转下划线
const toSnakeCase = (text) => splitWords(text).map((word) => word.toLowerCase()).join('_');

// 转常量名
const toConstantCase = (text) => toSnakeCase(text).toUpperCase();

// 转包名
const toPackageCase = (text) => splitWords(text).map((word) => word.toLowerCase()).join('.');

// 转点分名
const toDotCase = (text) => splitWords(text).map((word) => word.toLowerCase()).join('.');

// 转请求头名
const toHeaderCase = (text) => splitWords(text).map(capitalizeWord).join('-');

// 简单复数化
const pluralizeWord = (word) => {
  // y 结尾边界
  if (word.endsWith('y')) {
    return `${word.slice(0, -1)}ies`;
  }

  // s 结尾边界
  if (word.endsWith('s')) {
    return `${word}es`;
  }

  return `${word}s`;
};

// 转复数短横线
const toPluralKebabCase = (text) => {
  const words = splitWords(text).map((word) => word.toLowerCase());

  // 空文本边界
  if (words.length === 0) {
    return '';
  }

  const lastWord = words[words.length - 1];
  const pluralWords = [...words.slice(0, -1), pluralizeWord(lastWord)];

  return pluralWords.join('-');
};

// 转复数下划线
const toPluralSnakeCase = (text) => toPluralKebabCase(text).replace(/-/g, '_');


const namingGroupList = createNamingGroupList({
  toCamelCase,
  toConstantCase,
  toDotCase,
  toHeaderCase,
  toKebabCase,
  toPackageCase,
  toPascalCase,
  toPluralKebabCase,
  toPluralSnakeCase,
  toSnakeCase,
});

// 构建语言选项
const createLanguageOption = (group) => ({
  label: group.label,
  value: group.title,
});

const languageOptionList = namingGroupList.map(createLanguageOption);

// 拆为单词
const getSingleWordTranslations = (translations) => getUniqueTranslations(translations.flatMap(splitWords));

// 去重翻译结果
const getUniqueTranslations = (translations) => {
  const seenTextSet = new Set();

  return translations.filter((translation) => {
    const normalizedText = translation.trim().toLowerCase();

    // 空结果边界
    if (!normalizedText || seenTextSet.has(normalizedText)) {
      return false;
    }

    seenTextSet.add(normalizedText);

    return true;
  });
};

// 解析官方结果
const parseOfficialResult = (payload) => {
  const translations = payload?.data?.translations;

  // 响应边界
  if (!Array.isArray(translations)) {
    return [];
  }

  return translations.map((translation) => translation.translatedText || '');
};

// 解析公开结果
const parsePublicResult = (payload) => {
  const textParts = payload?.[0];
  const candidateList = payload?.[1] || [];

  // 响应边界
  if (!Array.isArray(textParts)) {
    return [];
  }

  const primaryText = textParts.map((item) => item[0] || '').join('');
  const extraTexts = candidateList.flatMap((item) => item[2] || []);

  return [primaryText, ...extraTexts];
};

// 请求谷歌官方
const fetchOfficialTranslation = async (sourceText) => {
  const params = new URLSearchParams({
    q: sourceText,
    source: 'zh-CN',
    target: 'en',
    format: 'text',
    key: GOOGLE_TRANSLATE_API_KEY,
  });
  const response = await fetch(`https://translation.googleapis.com/language/translate/v2?${params}`);

  // 请求失败边界
  if (!response.ok) {
    throw new Error('谷歌翻译请求失败');
  }

  const payload = await response.json();

  return parseOfficialResult(payload);
};

// 请求公开端点
const fetchPublicTranslation = async (sourceText) => {
  const params = new URLSearchParams({
    client: 'gtx',
    sl: 'zh-CN',
    tl: 'en',
    dt: 't',
    q: sourceText,
  });
  const response = await fetch(`https://translate.googleapis.com/translate_a/single?${params}`);

  // 请求失败边界
  if (!response.ok) {
    throw new Error('谷歌翻译请求失败');
  }

  const payload = await response.json();

  return parsePublicResult(payload);
};

// 翻译中文文本
const translateChinese = async (sourceText) => {
  const cleanText = sourceText.trim();

  // 空输入边界
  if (!cleanText) {
    throw new Error('请输入需要翻译的中文');
  }

  // 官方接口优先
  if (GOOGLE_TRANSLATE_API_KEY) {
    const translations = await fetchOfficialTranslation(cleanText);
    const uniqueTranslations = getUniqueTranslations(translations);

    // 空结果边界
    if (uniqueTranslations.length === 0) {
      throw new Error('未获取到翻译结果');
    }

    return uniqueTranslations;
  }

  const translations = await fetchPublicTranslation(cleanText);
  const uniqueTranslations = getUniqueTranslations(translations);

  // 空结果边界
  if (uniqueTranslations.length === 0) {
    throw new Error('未获取到翻译结果');
  }

  return uniqueTranslations;
};

// 单词按钮
const WordButton = ({ word, selected, onToggle }) => {
  // 切换单词
  const handleToggle = useMemoizedFn(() => {
    onToggle(word);
  });

  const className = [styles.wordButton, selected && styles.wordButtonActive].filter(Boolean).join(' ');

  return (
    <button type="button" className={className} onClick={handleToggle}>
      {word}
    </button>
  );
};

// 单词选择区
const WordPicker = ({ words, selectedWords, onToggle }) => {
  // 渲染单词
  const renderWordButton = useMemoizedFn((word) => (
    <WordButton key={word} word={word} selected={selectedWords.includes(word)} onToggle={onToggle} />
  ));

  // 空结果边界
  if (words.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="选择译文" />;
  }

  return <div className={styles.wordList}>{words.map(renderWordButton)}</div>;
};

// 译文按钮
const TranslationButton = ({ selected, translation, onSelect }) => {
  // 选择译文
  const handleSelect = useMemoizedFn(() => {
    onSelect(translation);
  });

  const className = [styles.translationButton, selected && styles.translationButtonActive].filter(Boolean).join(' ');

  return (
    <button type="button" className={className} onClick={handleSelect}>
      {translation}
    </button>
  );
};

// 译文选择区
const TranslationPicker = ({ selectedTranslation, translations, onSelect }) => {
  // 渲染译文
  const renderTranslationButton = useMemoizedFn((translation) => (
    <TranslationButton
      key={translation}
      selected={translation === selectedTranslation}
      translation={translation}
      onSelect={onSelect}
    />
  ));

  // 空结果边界
  if (translations.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="回车翻译" />;
  }

  return <div className={styles.translationList}>{translations.map(renderTranslationButton)}</div>;
};

// 语言选择区
const LanguagePicker = ({ selectedLanguages, onChange }) => (
  <div className={styles.languagePicker}>
    <Checkbox.Group
      className={styles.languageGroup}
      options={languageOptionList}
      value={selectedLanguages}
      onChange={onChange}
    />
  </div>
);

// 快捷名词标签
const QuickNounTag = ({ noun, onSelect }) => {
  // 选择名词
  const handleSelect = useMemoizedFn(() => {
    onSelect(noun);
  });

  return (
    <Tag className={styles.quickNounTag} onClick={handleSelect}>
      {noun}
    </Tag>
  );
};

// 快捷名词区
const QuickNounPicker = ({ onSelect }) => {
  // 渲染名词
  const renderNounTag = useMemoizedFn((noun) => <QuickNounTag key={noun} noun={noun} onSelect={onSelect} />);

  return <div className={styles.quickNounList}>{COMMON_NOUN_LIST.map(renderNounTag)}</div>;
};

// 翻译选择区
const TranslateSelector = ({
  sourceText,
  selectedTranslation,
  selectedWords,
  translations,
  words,
  onNounSelect,
  onSourceChange,
  onSourcePressEnter,
  onTranslationSelect,
  onWordToggle,
}) => (
  <div className={styles.translateGrid}>
    <section className={styles.sourcePanel}>
      <TextArea
        className={styles.sourceInput}
        rows={3}
        value={sourceText}
        placeholder="用户权限配置"
        onChange={onSourceChange}
        onPressEnter={onSourcePressEnter}
        allowClear
      />
      <QuickNounPicker onSelect={onNounSelect} />
    </section>
    <section className={styles.wordPanel}>
      <WordPicker words={words} selectedWords={selectedWords} onToggle={onWordToggle} />
    </section>
  </div>
);

// 命名文本
const NamingText = ({ description, label, value, onCopy }) => {
  // 点击复制
  const handleCopy = useMemoizedFn(() => {
    onCopy(value);
  });

  return (
    <button type="button" className={styles.namingItem} onClick={handleCopy}>
      <span className={styles.namingMeta}>
        <span className={styles.namingLabel}>{label}</span>
        <span className={styles.namingDesc}>{description}</span>
      </span>
      <span className={styles.namingText}>{value}</span>
    </button>
  );
};

// 命名结果卡
const NamingCard = ({ item, onCopy }) => (
  <NamingText description={item.description} label={item.label} value={item.value} onCopy={onCopy} />
);

// 命名分组
const NamingGroup = ({ group, selectedText, onCopy }) => {
  const namingList = group.items.map((typeItem) => ({
    description: typeItem.description,
    label: typeItem.label,
    value: typeItem.getValue(selectedText),
  }));

  // 渲染命名卡片
  const renderNamingCard = useMemoizedFn((item) => <NamingCard key={item.label} item={item} onCopy={onCopy} />);

  return (
    <section className={styles.groupCard}>
      <h2 className={styles.groupTitle}>{group.label}</h2>
      <div className={styles.namingList}>{namingList.map(renderNamingCard)}</div>
    </section>
  );
};

// 命名结果区
const NamingResult = ({ selectedLanguages, selectedText, onCopy }) => {
  const visibleNamingGroupList = namingGroupList.filter((group) => selectedLanguages.includes(group.title));

  // 渲染分组
  const renderNamingGroup = useMemoizedFn((group) => (
    <NamingGroup key={group.title} group={group} selectedText={selectedText} onCopy={onCopy} />
  ));

  // 未选择边界
  if (!selectedText) {
    return <Empty className={styles.emptyCard} image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无结果" />;
  }

  // 语言边界
  if (visibleNamingGroupList.length === 0) {
    return <Empty className={styles.emptyCard} image={Empty.PRESENTED_IMAGE_SIMPLE} description="请选择语言" />;
  }

  return <div className={styles.resultGrid}>{visibleNamingGroupList.map(renderNamingGroup)}</div>;
};

// 翻译页面
const Translate = () => {
  const { message } = App.useApp();
  const state = useReactive({
    sourceText: '',
    selectedLanguages: DEFAULT_LANGUAGE_LIST,
    selectedWords: [],
    selectedTranslation: '',
    translations: [],
    words: [],
  });

  // 翻译成功处理
  const handleTranslateSuccess = useMemoizedFn((translations) => {
    const [firstTranslation = ''] = translations;
    const words = getSingleWordTranslations([firstTranslation]);

    state.translations = translations;
    state.selectedTranslation = firstTranslation;
    state.words = words;
    state.selectedWords = words;
    message.success('翻译完成');
  });

  // 翻译失败处理
  const handleTranslateError = useMemoizedFn((error) => {
    message.error(error.message || '翻译失败，请稍后重试');
  });

  const { run: runTranslate } = useRequest(translateChinese, {
    manual: true,
    onSuccess: handleTranslateSuccess,
    onError: handleTranslateError,
  });

  // 更新中文输入
  const handleSourceChange = useMemoizedFn((event) => {
    state.sourceText = event.target.value;
  });

  // 选择快捷名词
  const handleNounSelect = useMemoizedFn((noun) => {
    state.sourceText += noun;
    state.selectedTranslation = '';
    state.selectedWords = [];
    state.translations = [];
    state.words = [];
  });

  // 回车翻译
  const handleSourcePressEnter = useMemoizedFn((event) => {
    // 换行边界
    if (event.shiftKey) {
      return;
    }

    event.preventDefault();
    runTranslate(state.sourceText);
  });

  // 选择译文
  const handleTranslationSelect = useMemoizedFn((translation) => {
    const words = getSingleWordTranslations([translation]);

    state.selectedTranslation = translation;
    state.words = words;
    state.selectedWords = words;
  });

  // 切换翻译单词
  const handleWordToggle = useMemoizedFn((word) => {
    const selectedWords = state.selectedWords;

    // 已选择边界
    if (selectedWords.includes(word)) {
      state.selectedWords = selectedWords.filter((selectedWord) => selectedWord !== word);
      return;
    }

    state.selectedWords = [...selectedWords, word];
  });

  // 切换语言分组
  const handleLanguageChange = useMemoizedFn((selectedLanguages) => {
    state.selectedLanguages = selectedLanguages;
  });

  // 复制命名文本
  const handleCopy = useMemoizedFn(async (value) => {
    // 剪贴板边界
    if (!navigator.clipboard) {
      message.error('当前浏览器不支持自动复制');
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      message.success('已复制');
    } catch (error) {
      message.error(error.message || '复制失败，请手动复制');
    }
  });

  const selectedText = state.selectedWords.join(' ');

  return (
    <Space orientation="vertical" size={8} className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.pageTitle}>翻译</div>
        <LanguagePicker selectedLanguages={state.selectedLanguages} onChange={handleLanguageChange} />
      </div>
      <TranslateSelector
        sourceText={state.sourceText}
        selectedTranslation={state.selectedTranslation}
        selectedWords={state.selectedWords}
        translations={state.translations}
        words={state.words}
        onNounSelect={handleNounSelect}
        onSourceChange={handleSourceChange}
        onSourcePressEnter={handleSourcePressEnter}
        onTranslationSelect={handleTranslationSelect}
        onWordToggle={handleWordToggle}
      />
      <NamingResult selectedLanguages={state.selectedLanguages} selectedText={selectedText} onCopy={handleCopy} />
    </Space>
  );
};

export default Translate;
