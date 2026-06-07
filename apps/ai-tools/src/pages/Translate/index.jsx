import { App, Empty, Input, Space } from 'antd';
import { useMemoizedFn, useReactive, useRequest } from 'ahooks';

import styles from './index.module.less';

const { TextArea } = Input;

const GOOGLE_TRANSLATE_API_KEY = import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY;

const namingGroupList = [
  {
    title: 'JS',
    items: [
      { label: '变量/函数', getValue: (name) => toCamelCase(name) },
      { label: 'is 布尔', getValue: (name) => `is${toPascalCase(name)}` },
      { label: 'has 布尔', getValue: (name) => `has${toPascalCase(name)}` },
      { label: 'can 布尔', getValue: (name) => `can${toPascalCase(name)}` },
      { label: 'should 布尔', getValue: (name) => `should${toPascalCase(name)}` },
      { label: '事件处理', getValue: (name) => `handle${toPascalCase(name)}` },
      { label: '回调属性', getValue: (name) => `on${toPascalCase(name)}` },
      { label: '获取', getValue: (name) => `get${toPascalCase(name)}` },
      { label: '请求', getValue: (name) => `fetch${toPascalCase(name)}` },
      { label: '创建', getValue: (name) => `create${toPascalCase(name)}` },
      { label: '更新', getValue: (name) => `update${toPascalCase(name)}` },
      { label: '删除', getValue: (name) => `delete${toPascalCase(name)}` },
      { label: '保存', getValue: (name) => `save${toPascalCase(name)}` },
      { label: '校验', getValue: (name) => `validate${toPascalCase(name)}` },
      { label: '解析', getValue: (name) => `parse${toPascalCase(name)}` },
      { label: '格式化', getValue: (name) => `format${toPascalCase(name)}` },
      { label: '常量', getValue: (name) => toConstantCase(name) },
      { label: '组件', getValue: (name) => toPascalCase(name) },
      { label: 'Hook', getValue: (name) => `use${toPascalCase(name)}` },
      { label: 'Store', getValue: (name) => `use${toPascalCase(name)}Store` },
      { label: 'Context', getValue: (name) => `${toPascalCase(name)}Context` },
      { label: 'Provider', getValue: (name) => `${toPascalCase(name)}Provider` },
      { label: '类型', getValue: (name) => toPascalCase(name) },
      { label: 'Props', getValue: (name) => `${toPascalCase(name)}Props` },
      { label: '路由', getValue: (name) => `/${toKebabCase(name)}` },
      { label: '文件', getValue: (name) => `${toKebabCase(name)}.js` },
      { label: '服务文件', getValue: (name) => `${toKebabCase(name)}.service.js` },
      { label: '测试文件', getValue: (name) => `${toKebabCase(name)}.test.js` },
      { label: '组件目录', getValue: (name) => `${toPascalCase(name)}/index.jsx` },
    ],
  },
  {
    title: 'Java',
    items: [
      { label: '类名', getValue: (name) => toPascalCase(name) },
      { label: '接口', getValue: (name) => toPascalCase(name) },
      { label: '方法/字段', getValue: (name) => toCamelCase(name) },
      { label: '布尔字段', getValue: (name) => `is${toPascalCase(name)}` },
      { label: '常量', getValue: (name) => toConstantCase(name) },
      { label: '包名', getValue: (name) => toPackageCase(name) },
      { label: 'Controller', getValue: (name) => `${toPascalCase(name)}Controller` },
      { label: 'Service', getValue: (name) => `${toPascalCase(name)}Service` },
      { label: 'ServiceImpl', getValue: (name) => `${toPascalCase(name)}ServiceImpl` },
      { label: 'Repository', getValue: (name) => `${toPascalCase(name)}Repository` },
      { label: 'Mapper', getValue: (name) => `${toPascalCase(name)}Mapper` },
      { label: 'DTO', getValue: (name) => `${toPascalCase(name)}DTO` },
      { label: 'VO', getValue: (name) => `${toPascalCase(name)}VO` },
      { label: 'BO', getValue: (name) => `${toPascalCase(name)}BO` },
      { label: 'Entity', getValue: (name) => `${toPascalCase(name)}Entity` },
      { label: 'Enum', getValue: (name) => `${toPascalCase(name)}Enum` },
      { label: 'Exception', getValue: (name) => `${toPascalCase(name)}Exception` },
      { label: 'Config', getValue: (name) => `${toPascalCase(name)}Config` },
      { label: 'Properties', getValue: (name) => `${toPascalCase(name)}Properties` },
      { label: 'Request', getValue: (name) => `${toPascalCase(name)}Request` },
      { label: 'Response', getValue: (name) => `${toPascalCase(name)}Response` },
      { label: '测试类', getValue: (name) => `${toPascalCase(name)}Test` },
      { label: '集成测试', getValue: (name) => `${toPascalCase(name)}IT` },
      { label: '文件名', getValue: (name) => `${toPascalCase(name)}.java` },
    ],
  },
  {
    title: 'Python',
    items: [
      { label: '变量/函数', getValue: (name) => toSnakeCase(name) },
      { label: '异步函数', getValue: (name) => `async_${toSnakeCase(name)}` },
      { label: '类名', getValue: (name) => toPascalCase(name) },
      { label: '常量', getValue: (name) => toConstantCase(name) },
      { label: '私有成员', getValue: (name) => `_${toSnakeCase(name)}` },
      { label: '魔术方法', getValue: (name) => `__${toSnakeCase(name)}__` },
      { label: '模块文件', getValue: (name) => `${toSnakeCase(name)}.py` },
      { label: '包目录', getValue: (name) => toSnakeCase(name) },
      { label: '测试文件', getValue: (name) => `test_${toSnakeCase(name)}.py` },
      { label: 'pytest', getValue: (name) => `test_${toSnakeCase(name)}` },
      { label: 'fixture', getValue: (name) => `${toSnakeCase(name)}_fixture` },
      { label: 'Pydantic', getValue: (name) => `${toPascalCase(name)}Model` },
      { label: 'Schema', getValue: (name) => `${toPascalCase(name)}Schema` },
      { label: 'SQLAlchemy', getValue: (name) => `${toPascalCase(name)}Table` },
      { label: 'Repository', getValue: (name) => `${toSnakeCase(name)}_repository` },
      { label: 'Service', getValue: (name) => `${toSnakeCase(name)}_service` },
      { label: '异常类', getValue: (name) => `${toPascalCase(name)}Error` },
      { label: 'Celery', getValue: (name) => `${toSnakeCase(name)}_task` },
      { label: '管理命令', getValue: (name) => toSnakeCase(name) },
      { label: 'FastAPI', getValue: (name) => `/${toKebabCase(name)}` },
    ],
  },
  {
    title: 'PHP',
    items: [
      { label: '变量', getValue: (name) => `$${toCamelCase(name)}` },
      { label: '方法', getValue: (name) => toCamelCase(name) },
      { label: '类名', getValue: (name) => toPascalCase(name) },
      { label: '接口', getValue: (name) => `${toPascalCase(name)}Interface` },
      { label: 'Trait', getValue: (name) => `${toPascalCase(name)}Trait` },
      { label: '命名空间', getValue: (name) => toPascalCase(name) },
      { label: '常量', getValue: (name) => toConstantCase(name) },
      { label: 'Controller', getValue: (name) => `${toPascalCase(name)}Controller` },
      { label: 'Service', getValue: (name) => `${toPascalCase(name)}Service` },
      { label: 'Repository', getValue: (name) => `${toPascalCase(name)}Repository` },
      { label: 'Model', getValue: (name) => `${toPascalCase(name)}Model` },
      { label: 'Request', getValue: (name) => `${toPascalCase(name)}Request` },
      { label: 'Resource', getValue: (name) => `${toPascalCase(name)}Resource` },
      { label: 'Middleware', getValue: (name) => `${toPascalCase(name)}Middleware` },
      { label: 'Policy', getValue: (name) => `${toPascalCase(name)}Policy` },
      { label: 'Job', getValue: (name) => `${toPascalCase(name)}Job` },
      { label: 'Event', getValue: (name) => `${toPascalCase(name)}Event` },
      { label: 'Listener', getValue: (name) => `${toPascalCase(name)}Listener` },
      { label: 'Migration', getValue: (name) => `create_${toPluralSnakeCase(name)}_table` },
      { label: 'Seeder', getValue: (name) => `${toPascalCase(name)}Seeder` },
      { label: 'Factory', getValue: (name) => `${toPascalCase(name)}Factory` },
      { label: 'Exception', getValue: (name) => `${toPascalCase(name)}Exception` },
      { label: '测试类', getValue: (name) => `${toPascalCase(name)}Test` },
      { label: '文件名', getValue: (name) => `${toPascalCase(name)}.php` },
    ],
  },
  {
    title: 'SQL',
    items: [
      { label: '表名', getValue: (name) => toPluralSnakeCase(name) },
      { label: '字段名', getValue: (name) => toSnakeCase(name) },
      { label: '主键', getValue: (name) => `${toSnakeCase(name)}_id` },
      { label: '外键', getValue: (name) => `${toSnakeCase(name)}_id` },
      { label: '布尔字段', getValue: (name) => `is_${toSnakeCase(name)}` },
      { label: '时间字段', getValue: (name) => `${toSnakeCase(name)}_at` },
      { label: '普通索引', getValue: (name) => `idx_${toSnakeCase(name)}` },
      { label: '唯一索引', getValue: (name) => `uk_${toSnakeCase(name)}` },
      { label: '外键约束', getValue: (name) => `fk_${toSnakeCase(name)}_id` },
      { label: '检查约束', getValue: (name) => `ck_${toSnakeCase(name)}` },
      { label: '默认约束', getValue: (name) => `df_${toSnakeCase(name)}` },
      { label: '查询别名', getValue: (name) => toSnakeCase(name) },
      { label: '迁移', getValue: (name) => `create_${toPluralSnakeCase(name)}_table` },
      { label: '视图', getValue: (name) => `v_${toSnakeCase(name)}` },
      { label: '物化视图', getValue: (name) => `mv_${toSnakeCase(name)}` },
      { label: '存储过程', getValue: (name) => `sp_${toSnakeCase(name)}` },
      { label: '函数', getValue: (name) => `fn_${toSnakeCase(name)}` },
      { label: '触发器', getValue: (name) => `trg_${toSnakeCase(name)}` },
      { label: '序列', getValue: (name) => `seq_${toSnakeCase(name)}` },
      { label: '临时表', getValue: (name) => `tmp_${toSnakeCase(name)}` },
      { label: '备份表', getValue: (name) => `${toSnakeCase(name)}_bak` },
    ],
  },
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
    const uniqueTranslations = getSingleWordTranslations(translations);

    // 空结果边界
    if (uniqueTranslations.length === 0) {
      throw new Error('未获取到翻译结果');
    }

    return uniqueTranslations;
  }

  const translations = await fetchPublicTranslation(cleanText);
  const uniqueTranslations = getSingleWordTranslations(translations);

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
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="回车翻译" />;
  }

  return <div className={styles.wordList}>{words.map(renderWordButton)}</div>;
};

// 翻译选择区
const TranslateSelector = ({ sourceText, selectedWords, words, onSourceChange, onSourcePressEnter, onWordToggle }) => (
  <div className={styles.translateGrid}>
    <section className={styles.sourcePanel}>
      <TextArea
        className={styles.sourceInput}
        rows={5}
        value={sourceText}
        placeholder="用户权限配置"
        onChange={onSourceChange}
        onPressEnter={onSourcePressEnter}
        allowClear
        borderless
      />
    </section>
    <section className={styles.wordPanel}>
      <WordPicker words={words} selectedWords={selectedWords} onToggle={onWordToggle} />
    </section>
  </div>
);

// 命名文本
const NamingText = ({ label, value, onCopy }) => {
  // 点击复制
  const handleCopy = useMemoizedFn(() => {
    onCopy(value);
  });

  return (
    <button type="button" className={styles.namingItem} onClick={handleCopy}>
      <span className={styles.namingLabel}>{label}</span>
      <span className={styles.namingText}>{value}</span>
    </button>
  );
};

// 命名结果卡
const NamingCard = ({ item, onCopy }) => <NamingText label={item.label} value={item.value} onCopy={onCopy} />;

// 命名分组
const NamingGroup = ({ group, selectedText, onCopy }) => {
  const namingList = group.items.map((typeItem) => ({
    label: typeItem.label,
    value: typeItem.getValue(selectedText),
  }));

  // 渲染命名卡片
  const renderNamingCard = useMemoizedFn((item) => <NamingCard key={item.label} item={item} onCopy={onCopy} />);

  return (
    <section className={styles.groupCard}>
      <h2 className={styles.groupTitle}>{group.title}</h2>
      <div className={styles.namingList}>{namingList.map(renderNamingCard)}</div>
    </section>
  );
};

// 命名结果区
const NamingResult = ({ selectedText, onCopy }) => {
  // 渲染分组
  const renderNamingGroup = useMemoizedFn((group) => (
    <NamingGroup key={group.title} group={group} selectedText={selectedText} onCopy={onCopy} />
  ));

  // 未选择边界
  if (!selectedText) {
    return <Empty className={styles.emptyCard} image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无结果" />;
  }

  return <div className={styles.resultGrid}>{namingGroupList.map(renderNamingGroup)}</div>;
};

// 翻译页面
const Translate = () => {
  const { message } = App.useApp();
  const state = useReactive({
    sourceText: '',
    selectedWords: [],
    words: [],
  });

  // 翻译成功处理
  const handleTranslateSuccess = useMemoizedFn((words) => {
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

  // 回车翻译
  const handleSourcePressEnter = useMemoizedFn((event) => {
    // 换行边界
    if (event.shiftKey) {
      return;
    }

    event.preventDefault();
    runTranslate(state.sourceText);
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
    <Space direction="vertical" size={8} className={styles.page}>
      <TranslateSelector
        sourceText={state.sourceText}
        selectedWords={state.selectedWords}
        words={state.words}
        onSourceChange={handleSourceChange}
        onSourcePressEnter={handleSourcePressEnter}
        onWordToggle={handleWordToggle}
      />
      <NamingResult selectedText={selectedText} onCopy={handleCopy} />
    </Space>
  );
};

export default Translate;
