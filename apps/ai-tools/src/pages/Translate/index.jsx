import { App, Button, Card, Col, Empty, Input, Row, Space, Typography } from 'antd';
import { useMemoizedFn, useReactive, useRequest } from 'ahooks';

import styles from './index.module.less';

const { TextArea } = Input;

const GOOGLE_TRANSLATE_API_KEY = import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY;

const namingGroupList = [
  {
    title: 'JavaScript / TypeScript',
    items: [
      { label: '变量 / 函数', getValue: (name) => toCamelCase(name) },
      { label: '布尔 is', getValue: (name) => `is${toPascalCase(name)}` },
      { label: '布尔 has', getValue: (name) => `has${toPascalCase(name)}` },
      { label: '布尔 can', getValue: (name) => `can${toPascalCase(name)}` },
      { label: '事件处理', getValue: (name) => `handle${toPascalCase(name)}` },
      { label: '请求函数', getValue: (name) => `fetch${toPascalCase(name)}` },
      { label: '常量', getValue: (name) => toConstantCase(name) },
      { label: '类型别名', getValue: (name) => `${toPascalCase(name)}Type` },
      { label: '接口类型', getValue: (name) => `${toPascalCase(name)}Props` },
      { label: 'JS 文件', getValue: (name) => `${toKebabCase(name)}.js` },
      { label: 'TS 文件', getValue: (name) => `${toKebabCase(name)}.ts` },
      { label: '测试文件', getValue: (name) => `${toKebabCase(name)}.test.ts` },
    ],
  },
  {
    title: 'React / Vue 前端',
    items: [
      { label: '组件', getValue: (name) => toPascalCase(name) },
      { label: 'React Hook', getValue: (name) => `use${toPascalCase(name)}` },
      { label: 'Context', getValue: (name) => `${toPascalCase(name)}Context` },
      { label: 'Provider', getValue: (name) => `${toPascalCase(name)}Provider` },
      { label: 'Store Hook', getValue: (name) => `use${toPascalCase(name)}Store` },
      { label: 'Props', getValue: (name) => `${toPascalCase(name)}Props` },
      { label: '状态字段', getValue: (name) => toCamelCase(name) },
      { label: '页面文件', getValue: (name) => `${toPascalCase(name)}/index.jsx` },
      { label: '组件样式', getValue: (name) => `${toPascalCase(name)}/index.module.less` },
      { label: '路由路径', getValue: (name) => `/${toKebabCase(name)}` },
      { label: 'Vue 组件', getValue: (name) => `${toPascalCase(name)}.vue` },
      { label: '组合函数', getValue: (name) => `use${toPascalCase(name)}` },
    ],
  },
  {
    title: 'Java / Spring',
    items: [
      { label: '类名', getValue: (name) => toPascalCase(name) },
      { label: '接口', getValue: (name) => toPascalCase(name) },
      { label: '方法 / 字段', getValue: (name) => toCamelCase(name) },
      { label: '布尔字段', getValue: (name) => `is${toPascalCase(name)}` },
      { label: '常量', getValue: (name) => toConstantCase(name) },
      { label: '包名', getValue: (name) => toPackageCase(name) },
      { label: 'Controller', getValue: (name) => `${toPascalCase(name)}Controller` },
      { label: 'Service', getValue: (name) => `${toPascalCase(name)}Service` },
      { label: 'Repository', getValue: (name) => `${toPascalCase(name)}Repository` },
      { label: 'DTO', getValue: (name) => `${toPascalCase(name)}DTO` },
      { label: 'Entity', getValue: (name) => `${toPascalCase(name)}Entity` },
      { label: 'Exception', getValue: (name) => `${toPascalCase(name)}Exception` },
      { label: '测试类', getValue: (name) => `${toPascalCase(name)}Test` },
    ],
  },
  {
    title: 'Python',
    items: [
      { label: '变量 / 函数', getValue: (name) => toSnakeCase(name) },
      { label: '类名', getValue: (name) => toPascalCase(name) },
      { label: '常量', getValue: (name) => toConstantCase(name) },
      { label: '私有变量', getValue: (name) => `_${toSnakeCase(name)}` },
      { label: '魔术方法风格', getValue: (name) => `__${toSnakeCase(name)}__` },
      { label: '异步函数', getValue: (name) => `async_${toSnakeCase(name)}` },
      { label: '模块文件', getValue: (name) => `${toSnakeCase(name)}.py` },
      { label: '测试文件', getValue: (name) => `test_${toSnakeCase(name)}.py` },
      { label: 'pytest 用例', getValue: (name) => `test_${toSnakeCase(name)}` },
      { label: 'Pydantic 模型', getValue: (name) => `${toPascalCase(name)}Model` },
      { label: 'SQLAlchemy 模型', getValue: (name) => `${toPascalCase(name)}Table` },
      { label: 'FastAPI 路由', getValue: (name) => `/${toKebabCase(name)}` },
    ],
  },
  {
    title: 'PHP / Laravel',
    items: [
      { label: '变量', getValue: (name) => `$${toCamelCase(name)}` },
      { label: '方法', getValue: (name) => toCamelCase(name) },
      { label: '类名', getValue: (name) => toPascalCase(name) },
      { label: '接口', getValue: (name) => `${toPascalCase(name)}Interface` },
      { label: 'Trait', getValue: (name) => `${toPascalCase(name)}Trait` },
      { label: '常量', getValue: (name) => toConstantCase(name) },
      { label: 'Controller', getValue: (name) => `${toPascalCase(name)}Controller` },
      { label: 'Service', getValue: (name) => `${toPascalCase(name)}Service` },
      { label: 'Repository', getValue: (name) => `${toPascalCase(name)}Repository` },
      { label: 'Request', getValue: (name) => `${toPascalCase(name)}Request` },
      { label: 'Resource', getValue: (name) => `${toPascalCase(name)}Resource` },
      { label: '文件名', getValue: (name) => `${toPascalCase(name)}.php` },
    ],
  },
  {
    title: 'API / 路由 / 事件',
    items: [
      { label: 'REST 资源', getValue: (name) => `/${toPluralKebabCase(name)}` },
      { label: 'REST 详情', getValue: (name) => `/${toPluralKebabCase(name)}/:id` },
      { label: 'Query 参数', getValue: (name) => toCamelCase(name) },
      { label: 'Path 参数', getValue: (name) => `${toCamelCase(name)}Id` },
      { label: 'Header', getValue: (name) => `X-${toHeaderCase(name)}` },
      { label: '权限标识', getValue: (name) => toDotCase(name) },
      { label: '事件名', getValue: (name) => toDotCase(name) },
      { label: '队列名', getValue: (name) => toKebabCase(name) },
      { label: 'Topic', getValue: (name) => toSlashCase(name) },
      { label: 'Feature Flag', getValue: (name) => toSnakeCase(name) },
    ],
  },
  {
    title: '数据库 / SQL',
    items: [
      { label: '表名', getValue: (name) => toPluralSnakeCase(name) },
      { label: '字段名', getValue: (name) => toSnakeCase(name) },
      { label: '主键字段', getValue: (name) => `${toSnakeCase(name)}_id` },
      { label: '外键字段', getValue: (name) => `${toSnakeCase(name)}_id` },
      { label: '普通索引', getValue: (name) => `idx_${toSnakeCase(name)}` },
      { label: '唯一索引', getValue: (name) => `uk_${toSnakeCase(name)}` },
      { label: '外键约束', getValue: (name) => `fk_${toSnakeCase(name)}_id` },
      { label: '迁移文件', getValue: (name) => `create_${toPluralSnakeCase(name)}_table` },
      { label: '视图名', getValue: (name) => `v_${toSnakeCase(name)}` },
      { label: '存储过程', getValue: (name) => `sp_${toSnakeCase(name)}` },
    ],
  },
  {
    title: 'CSS / 文件 / CLI',
    items: [
      { label: 'CSS 类名', getValue: (name) => toKebabCase(name) },
      { label: 'BEM 元素', getValue: (name) => `${toKebabCase(name)}__item` },
      { label: 'BEM 状态', getValue: (name) => `${toKebabCase(name)}--active` },
      { label: 'CSS 变量', getValue: (name) => `--${toKebabCase(name)}` },
      { label: 'Less 文件', getValue: (name) => `${toKebabCase(name)}.less` },
      { label: '目录名', getValue: (name) => toKebabCase(name) },
      { label: '配置文件', getValue: (name) => `${toKebabCase(name)}.config.js` },
      { label: '环境变量', getValue: (name) => `VITE_${toConstantCase(name)}` },
      { label: 'CLI 命令', getValue: (name) => toKebabCase(name) },
      { label: '日志字段', getValue: (name) => toSnakeCase(name) },
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

// 转点分名
const toDotCase = (text) => splitWords(text).map((word) => word.toLowerCase()).join('.');

// 转斜线名
const toSlashCase = (text) => splitWords(text).map((word) => word.toLowerCase()).join('/');

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

// 构造选项
const getTranslationOptions = (translations) => translations.map((translation) => ({ label: translation, value: translation }));

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

// 页面标题
const PageHeader = () => (
  <div className={styles.header}>
    <Typography.Title className={styles.title} level={3}>
      翻译命名
    </Typography.Title>
    <Typography.Text className={styles.subtitle} type="secondary">
      输入中文后翻译为英文，选择需要的单词，即可生成多语言常用命名格式。
    </Typography.Text>
  </div>
);

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
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无翻译结果" />;
  }

  return <div className={styles.wordList}>{words.map(renderWordButton)}</div>;
};

// 翻译选择区
const TranslateSelector = ({ sourceText, selectedWords, words, loading, onSourceChange, onSourcePressEnter, onTranslate, onWordToggle }) => (
  <Card className={styles.translateCard} title="翻译与选择" bordered={false}>
    <div className={styles.translateGrid}>
      <section className={styles.sourcePanel}>
        <Typography.Text className={styles.panelTitle}>中文输入</Typography.Text>
        <TextArea
          className={styles.sourceInput}
          autoSize={{ minRows: 4, maxRows: 8 }}
          value={sourceText}
          placeholder="例如：用户权限配置"
          onChange={onSourceChange}
          onPressEnter={onSourcePressEnter}
        />
        <Typography.Text className={styles.helperText}>Enter 翻译，Shift + Enter 换行</Typography.Text>
      </section>
      <div className={styles.actionPanel}>
        <Button type="primary" size="large" loading={loading} onClick={onTranslate}>
          翻译
        </Button>
      </div>
      <section className={styles.wordPanel}>
        <Typography.Text className={styles.panelTitle}>选择单词</Typography.Text>
        <WordPicker words={words} selectedWords={selectedWords} onToggle={onWordToggle} />
      </section>
    </div>
  </Card>
);

// 命名文本
const NamingText = ({ value, onCopy }) => {
  // 点击复制
  const handleCopy = useMemoizedFn(() => {
    onCopy(value);
  });

  return (
    <button type="button" className={styles.namingText} onClick={handleCopy}>
      {value}
    </button>
  );
};

// 命名结果卡
const NamingCard = ({ item, onCopy }) => (
  <Col xs={24} md={12} xl={8} xxl={6}>
    <Card className={styles.namingCard} bordered={false} title={item.label}>
      <NamingText value={item.value} onCopy={onCopy} />
    </Card>
  </Col>
);

// 命名分组
const NamingGroup = ({ group, selectedText, onCopy }) => {
  const namingList = group.items.map((typeItem) => ({
    label: typeItem.label,
    value: typeItem.getValue(selectedText),
  }));

  // 渲染命名卡片
  const renderNamingCard = useMemoizedFn((item) => <NamingCard key={item.label} item={item} onCopy={onCopy} />);

  return (
    <Card className={styles.groupCard} bordered={false} title={group.title}>
      <Row gutter={[14, 14]}>{namingList.map(renderNamingCard)}</Row>
    </Card>
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
    return (
      <Card className={styles.emptyCard} title="命名格式" bordered={false}>
        <Empty description="选择翻译结果后自动生成" />
      </Card>
    );
  }

  return <Space direction="vertical" size={18} className={styles.resultStack}>{namingGroupList.map(renderNamingGroup)}</Space>;
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

  const { run: runTranslate, loading: isTranslating } = useRequest(translateChinese, {
    manual: true,
    onSuccess: handleTranslateSuccess,
    onError: handleTranslateError,
  });

  // 更新中文输入
  const handleSourceChange = useMemoizedFn((event) => {
    state.sourceText = event.target.value;
  });

  // 触发翻译请求
  const handleTranslate = useMemoizedFn(() => {
    runTranslate(state.sourceText);
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
    <Space direction="vertical" size={24} className={styles.page}>
      <PageHeader />
      <TranslateSelector
        sourceText={state.sourceText}
        selectedWords={state.selectedWords}
        words={state.words}
        loading={isTranslating}
        onSourceChange={handleSourceChange}
        onSourcePressEnter={handleSourcePressEnter}
        onTranslate={handleTranslate}
        onWordToggle={handleWordToggle}
      />
      <NamingResult selectedText={selectedText} onCopy={handleCopy} />
    </Space>
  );
};

export default Translate;
