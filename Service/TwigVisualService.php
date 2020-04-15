<?php

namespace Andchir\TwigVisualBundle\Service;

use IvoPetkov\HTML5DOMElement;
use Symfony\Bundle\FrameworkBundle\Console\Application;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use Symfony\Component\HttpKernel\KernelInterface;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Output\BufferedOutput;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Bridge\Twig\AppVariable;
use Doctrine\Common\Persistence\ObjectManager;
use Doctrine\Common\Persistence\ObjectRepository;
use Symfony\Component\Yaml\Yaml;
use Twig\Environment as TwigEnvironment;
use XhtmlFormatter\Formatter;
use IvoPetkov\HTML5DOMDocument;

class TwigVisualService {

    const INCLUDES_DIRNAME = 'generic';
    /** @var TwigEnvironment */
    protected $twig;
    /** @var ParameterBagInterface */
    protected $params;
    /** @var KernelInterface */
    protected $kernel;
    /** @var array */
    protected $config;
    private $cacheArray = [];
    private $refererUrl = '';
    private $errorMessage = '';
    private $isError = false;

    public function __construct(
        ParameterBagInterface $params,
        TwigEnvironment $twig,
        KernelInterface $kernel,
        array $config = []
    )
    {
        $this->kernel = $kernel;
        $this->params = $params;
        $this->twig = $twig;
        
        if (empty($config) && $params->has('twigvisual_config')) {
            $this->config = $params->get('twigvisual_config');
        } else {
            $this->config = $config;
        }
    }

    /**
     * @param string $errorMessage
     */
    public function setErrorMessage($errorMessage)
    {
        $this->isError = true;
        $this->errorMessage = $errorMessage;
    }

    /**
     * @return string
     */
    public function getErrorMessage()
    {
        return $this->errorMessage;
    }

    /**
     * @param $refererUrl
     */
    public function setRefererUrl($refererUrl)
    {
        $this->refererUrl = $refererUrl;
        return $this;
    }

    /**
     * @return array
     */
    public function getConfig()
    {
        return $this->config;
    }

    /**
     * @return string
     */
    public function getScriptOptions($templateName, $templatContext)
    {
        $uiConfig = $this->getConfigValue('ui');
        $uiOutput = [];
        foreach ($uiConfig as $key => $opts) {
            if (!isset($opts['title']) || !isset($opts['title'])) {
                continue;
            }
            $components = [];
            foreach ($opts['components'] as $k => $v) {
                if ($k === 'root' || !isset($v['title']) || !isset($v['type'])) {
                    continue;
                }
                $components[] = [
                    'name' => $k,
                    'title' => $v['title'],
                    'type' => $v['type'],
                    'required' => !empty($v['required']),
                    'styleName' => $v['styleName'] ?? ''
                ];
            }
            $uiOutput[$key] = [
                'title' => $opts['title'],
                'components' => $components
            ];
        }
        $options = [
            'templateName' => $templateName,
            'templates' => $this->getConfigValue('templates'),
            'uiOptions' => $uiOutput,
            'pageFields' => self::getDataKeys($templatContext)
        ];
        return $options;
    }

    /**
     * @param string $key
     * @param string $default
     * @return mixed|string
     */
    public function getConfigValue($key, $secondKey = null, $default = '')
    {
        if ($key && $secondKey) {
            return isset($this->config[$key]) ? ($this->config[$key][$secondKey] ?? $default) : $default;
        }
        return $this->config[$key] ?? $default;
    }

    /**
     * @param string $key
     * @param mixed $value
     * @return $this
     */
    public function setConfigValue($key, $value)
    {
        $this->config[$key] = $value;
        return $this;
    }

    /**
     * @return string
     */
    public function getScriptContent($commentKey = '')
    {
        $o = $commentKey ? PHP_EOL . "        <!-- {$commentKey} -->" : '';
        $c = $commentKey ? "<!-- /{$commentKey} -->" . PHP_EOL : '';
        return $o . '
        {% if is_granted(\'ROLE_ADMIN\') %}
            <link href="{{ asset(\'bundles/twigvisual/css/twv-icomoon/style.css\') }}" rel="stylesheet">
            <link href="{{ asset(\'bundles/twigvisual/css/twigvisual.css\') }}" rel="stylesheet">
            <script src="{{ asset(\'bundles/twigvisual/dist/twigvisual.js\') }}"></script>
            <script>
				const twigVisual = new TwigVisual({{ twigVisualOptions(_self, _context) }});
			</script>
        {% endif %}
        ' . $c;
    }

    /**
     * @param $templatePublicFilePath
     * @return false|string
     */
    public function prepareTemplateContent($templatePublicFilePath, $themeName)
    {
        if (!file_exists($templatePublicFilePath)) {
            return false;
        }
        $templateAssetsBaseUrl = "/assets/{$themeName}/";
        $templateContent = file_get_contents($templatePublicFilePath);

        // Styles
        preg_match_all('/(?:"|\')(?:[^"\']+)\.css(?:"|\')/', $templateContent, $matches);
        if (!empty($matches[0])) {
            foreach ($matches[0] as $input) {
                $inputOutput = substr($input, 0, 1) . $templateAssetsBaseUrl . substr($input, 1);
                $templateContent = str_replace($input, $inputOutput, $templateContent);
            }
            unset($matches);
        }
        
        // Scripts
        preg_match_all('/(?:"|\')(?:[^"\']+)\.js(?:"|\')/', $templateContent, $matches);
        if (!empty($matches[0])) {
            foreach ($matches[0] as $input) {
                $inputOutput = substr($input, 0, 1) . $templateAssetsBaseUrl . substr($input, 1);
                $templateContent = str_replace($input, $inputOutput, $templateContent);
            }
            unset($matches);
        }

        // Images
        preg_match_all('/(?:"|\')(?:[^"\']+)\.(?:jpg|jpeg|png|gif|webp|ico)(?:"|\')/', $templateContent, $matches);
        preg_match_all('/(?:\()(?:[^\)]+)\.(?:jpg|jpeg|png|gif|webp|ico)(?:\))/', $templateContent, $matches2);
        if (empty($matches[0])) {
            $matches = [[]];
        }
        if (empty($matches2[0])) {
            $matches2 = [[]];
        }
        $matches[0] = array_merge($matches[0], $matches2[0]);
        if (!empty($matches[0])) {
            foreach ($matches[0] as $input) {
                $inputOutput = substr($input, 0, 1) . $templateAssetsBaseUrl . substr($input, 1);
                $templateContent = str_replace($input, $inputOutput, $templateContent);
            }
        }
        
        // TwigVisual assets
        $templateContent = str_replace('</head>', $this->getScriptContent('twv-script') . PHP_EOL . '</head>', $templateContent);
        
        return $templateContent;
    }

    /**
     * Copy template files from default theme
     * @param string $themeName
     * @return bool
     * @throws \Twig\Error\LoaderError
     */
    public function copyDefaultFiles($themeName)
    {
        $defaultFiles = $this->getConfigValue('default_copy');
        $currentThemeDirPath = $this->getCurrentThemeDirPath();
        $newThemeDirPath = dirname($currentThemeDirPath) . DIRECTORY_SEPARATOR . $themeName;
        if (!is_dir($newThemeDirPath)) {
            mkdir($newThemeDirPath);
        }
        foreach ($defaultFiles as $defaultFile) {
            $sourceFilePath = $currentThemeDirPath . DIRECTORY_SEPARATOR . $defaultFile;
            $targetFilePath = $newThemeDirPath . DIRECTORY_SEPARATOR . $defaultFile;
            if (!file_exists($sourceFilePath)) {
                $sourceFilePath .= '.' . $this->config['templates_extension'];
                $targetFilePath .= '.' . $this->config['templates_extension'];
            }
            if (!is_dir(dirname($targetFilePath))) {
                mkdir(dirname($targetFilePath));
            }
            if (file_exists($targetFilePath)) {
                unlink($targetFilePath);
            }
            if (!copy($sourceFilePath, $targetFilePath)) {
                return false;
            }
        }
        return true;
    }

    /**
     * @param bool $cleanExtensions
     * @return array
     * @throws \Twig\Error\LoaderError
     */
    public function getIncludesList($cleanExtensions = false)
    {
        $templatesExtension = $this->getConfigValue('templates_extension');
        $themeDirPath = $this->getCurrentThemeDirPath();
        $templatesDirPath = $themeDirPath . DIRECTORY_SEPARATOR . self::INCLUDES_DIRNAME;
        $files = array_slice(scandir($templatesDirPath), 2);
        if ($cleanExtensions) {
            $files = array_map(function($fileName) use ($templatesExtension) {
                return str_replace('.' . $templatesExtension, '', $fileName);
            }, $files);
        }
        sort($files);
        return $files;
    }

    /**
     * @param string $templateCode
     * @return string
     */
    public function parseIncludes($templateCode)
    {
        $templatesExtension = $this->getConfigValue('templates_extension');
        $themeDirPath = $this->getCurrentThemeDirPath();
        
        $pattern = "/\{% include '([^\']+)' %\}/";
        preg_match_all($pattern, $templateCode, $matches);
        
        foreach ($matches[0] as $index => $match) {
            $templateName = $matches[1][$index];
            $templatePath = $themeDirPath . DIRECTORY_SEPARATOR . $templateName;
            if (!file_exists($templatePath)) {
                continue;
            }
            $content = file_get_contents($templatePath);
            $content = self::createCommentContent('twv-include-' . $templateName, $content);
            $templateCode = str_replace($match, $content, $templateCode);
        }
        
        return $templateCode;
    }

    /**
     * @param string $templateCode
     * @return string
     * @throws \Twig\Error\LoaderError
     */
    public function updateIncludes($templateCode)
    {
        $updateIncludeSource = $this->getConfigValue('updateIncludeSource', '', true);
        $includes = $this->getIncludesList();
        $themeDirPath = $this->getCurrentThemeDirPath();
        foreach ($includes as $templateName) {
            $commentKey = 'twv-include-' . self::INCLUDES_DIRNAME . DIRECTORY_SEPARATOR . $templateName;
            $commentContent = self::getCommentContent($commentKey, $templateCode);
            if (!$commentContent) {
                continue;
            }
            if ($updateIncludeSource) {
                $templatePath = $themeDirPath . DIRECTORY_SEPARATOR . self::INCLUDES_DIRNAME . DIRECTORY_SEPARATOR . $templateName;
                file_put_contents($templatePath, trim($commentContent));
            }
            $includeCode = '{% include \'' . self::INCLUDES_DIRNAME . DIRECTORY_SEPARATOR . $templateName . '\' %}';
            $templateCode = self::replaceCommentContent($commentKey, $includeCode, $templateCode, true);
        }
        return $templateCode;
    }

    /**
     * @param string $templateName
     * @param string $xpathQuery
     * @param string $textContent
     * @return bool
     */
    public function editTextContent($templateName, $xpathQuery, $innerHTML)
    {
        try {
            $result = $this->getDocumentNode($templateName, $xpathQuery, true);
        } catch (\Exception $e) {
            $this->setErrorMessage($e->getMessage());
            return false;
        }
        list($templateFilePath, $doc, $node) = $result;
        $node->innerHTML = $innerHTML;

        return $this->saveTemplateContent($doc, $templateFilePath);
    }

    /**
     * @param string $templateName
     * @param string $xpathQuery
     * @param array $attributes
     * @return bool
     */
    public function editAttributes($templateName, $xpathQuery, $attributes)
    {
        try {
            $result = $this->getDocumentNode($templateName, $xpathQuery, true);
        } catch (\Exception $e) {
            $this->setErrorMessage($e->getMessage());
            return false;
        }
        list($templateFilePath, $doc, $node) = $result;
        foreach ($attributes as $key => $value) {
            $node->setAttribute($key, $value);
        }

        return $this->saveTemplateContent($doc, $templateFilePath);
    }

    /**
     * Delete element
     * @param string $templateName
     * @param string $xpathQuery
     */
    public function deleteTemplateElement($templateName, $xpathQuery)
    {
        try {
            $result = $this->getDocumentNode($templateName, $xpathQuery);
        } catch (\Exception $e) {
            $this->setErrorMessage($e->getMessage());
            return false;
        }
        list($templateFilePath, $doc, $node) = $result;
        
        try {
            $this->deleteElement($node);
        } catch (\Exception $e) {
            $this->setErrorMessage($e->getMessage());
            return false;
        }
        
        return $this->saveTemplateContent($doc, $templateFilePath);
    }

    /**
     * @param HTML5DOMElement $node
     */
    public function deleteElement($node)
    {
        $dinamicParent = self::findDinamicParent($node);
        if (!empty($dinamicParent)) {
            if ($dinamicParent === $node) {
                $commentOpen = self::getPreviousSiblingByType($node, XML_COMMENT_NODE);
                $commentClosed = self::getNextSiblingByType($node, XML_COMMENT_NODE);
                $node->parentNode->removeChild($commentOpen);
                $node->parentNode->removeChild($commentClosed);
                $node->parentNode->removeChild($node);
            } else {
                throw new \Exception('The item is already dynamic.');
            }
        } else {
            $node->parentNode->removeChild($node);
        }
    }

    /**
     * @param HTML5DOMDocument $doc
     * @param string $templateFilePath
     * @param bool $clearCache
     * @param bool $replaceFromLocalCache
     * @return bool
     */
    public function saveTemplateContent(HTML5DOMDocument $doc, $templateFilePath, $clearCache = true, $replaceFromLocalCache = true)
    {
        if (!is_writable($templateFilePath)) {
            $this->setErrorMessage('Template is not writable.');
            return false;
        }
        $htmlContent = $doc->saveHTML();
        $htmlContent = self::unescapeUrls($htmlContent);
        $htmlContent = self::replaceCommentContent('twv-script', $this->getScriptContent(), $htmlContent);
        if ($replaceFromLocalCache) {
            foreach ($this->cacheArray as $key => $val) {
                $htmlContent = self::replaceCommentContent($key, $val, $htmlContent);
            }
        }
        $htmlContent = $this->updateIncludes($htmlContent);

        file_put_contents($templateFilePath, $htmlContent);

        if ($clearCache) {
            $this->twigCacheClear();
        }
        return true;
    }

    /**
     * @param string $templateName
     * @param string|null $xpathQuery
     * @param bool $checkIsDinamic
     * @return array
     * @throws \Psr\Cache\InvalidArgumentException
     * @throws \Twig\Error\LoaderError
     * @throws \Twig\Error\SyntaxError
     */
    public function getDocumentNode($templateName, $xpathQuery = null, $checkIsDinamic = false)
    {
        $templateData = $this->getTemplateSource($templateName);
        $templateCode = $templateData['source_code'];
        
        $docTemplate = new HTML5DOMDocument();

        $docTemplate->loadHTML($templateCode);
        if (!$xpathQuery) {
            return [$templateData['file_path'], $docTemplate, null];
        }
        $xpath = new \DOMXPath($docTemplate);

        /** @var \DOMNodeList $entries */
        $entries = $xpath->evaluate($xpathQuery, $docTemplate);
        if ($entries->count() === 0) {
            throw new \Exception('Element not found.');
        }
        $node = $entries->item(0);
        if ($checkIsDinamic && $this->isDinamic($node)) {
            throw new \Exception('The item is already dynamic.');
        }

        return [$templateData['file_path'], $docTemplate, $node];
    }

    /**
     * @param string $templateName
     * @param bool $replaceFromCache
     * @return array
     * @throws \Psr\Cache\InvalidArgumentException
     * @throws \Twig\Error\LoaderError
     * @throws \Twig\Error\SyntaxError
     */
    public function getTemplateSource($templateName, $replaceFromCache = true)
    {
        $template = $this->twig->resolveTemplate($templateName);
        $templateSource = $template->getSourceContext();
        $templateCode = $templateSource->getCode();
        if (!$templateSource->getCode() && file_exists($templateSource->getPath())) {
            $templateCode = file_get_contents($templateSource->getPath());
        }
        $templateCode = self::cutCommentContent('twv-script', $templateCode);
        $templateCode = $this->parseIncludes($templateCode);

        if ($replaceFromCache) {
            $cacheContentArray = $this->cacheGet($this->getCurrentThemeName());
            foreach ($cacheContentArray as $key => $val) {
                $this->cacheArray[$key] = self::getCommentContent($key, $templateCode);
                $templateCode = self::replaceCommentContent($key, $val, $templateCode);
            }
        }
        
        return [
            'file_path' => $templateSource->getPath(),
            'starting_line' => 1,
            'source_code' => $templateCode
        ];
    }

    /**
     * @param HTML5DOMDocument $doc
     * @param array $data
     * @param array $uiBlockConfig
     * @return array
     */
    public function getUiElements($doc, $data, &$uiBlockConfig)
    {
        $elements = [];
        foreach ($data['data'] as $key => $xpathQuery) {
            if (in_array($key, ['root', 'source']) || !isset($uiBlockConfig['components'][$key])) {
                continue;
            }
            if ($uiBlockConfig['components'][$key]['type'] == 'elementSelect') {
                $xpath = new \DOMXPath($doc);
                /** @var \DOMNodeList $entries */
                $entries = $xpath->evaluate($xpathQuery, $doc);
                if ($entries->count() === 0) {
                    $elements[$key] = null;
                    continue;
                }
                $elements[$key] = $entries->item(0);
                $uiBlockConfig['components'][$key]['sourceHTML'] = $elements[$key]->outerHTML;
            }
        }
        return $elements;
    }

    /**
     * @param array $uiBlockConfig
     * @param array $data
     */
    public function prepareOptionsByValues(&$uiBlockConfig, $data)
    {
        if (!isset($data['data'])) {
            return;
        }
        
        // Prepare data
        foreach ($data['data'] as $key => &$v) {
            $opts = $uiBlockConfig['components'][$key] ?? [];
            if (!empty($opts['join'])) {
                $keysArr = explode(',', $opts['join']);
                $valuesArr = [];
                $separator = $opts['separator'] ?? '.';
                foreach ($keysArr as $k) {
                    if (!empty($data['data'][$k])) {
                        $valuesArr[] = $data['data'][$k];
                    }
                }
                if (!empty($valuesArr)) {
                    $data['data'][$key] .= $separator . implode($separator, $valuesArr);
                }
            }
        }
        
        foreach ($uiBlockConfig['components'] as $key => &$opts) {
            if (!isset($opts['type'])) {
                continue;
            }
            if (isset($data['data'][$key])) {
                $opts['value'] = $data['data'][$key];
            }
            if (isset($opts['template'])) {
                $opts['template'] = self::replaceTemplateVariables($opts['template'], $data['data']);
            }
            if (isset($opts['templatePath'])) {
                $opts['templatePath'] = self::replaceTemplateVariables($opts['templatePath'], $data['data']);
            }
            if (isset($opts['output'])) {
                $opts['output'] = self::replaceTemplateVariables($opts['output'], $data['data']);
            }
        }
    }
    
    /**
     * @param array $uiBlockConfig
     * @param array $elements
     * @param string $templateName
     * @return bool
     */
    public function prepareOptionsByTemplates(&$uiBlockConfig, &$elements, $templateName)
    {
        // Get static options
        $staticOptions = [];
        foreach ($uiBlockConfig['components'] as $key => $opts) {
            $type = $opts['type'] ?? '';
            if (in_array($type, ['static', 'text']) && isset($opts['value'])) {
                $staticOptions[$key] = $opts['value'];
            }
        }
        unset($key);

        $keys = array_keys($uiBlockConfig['components']);
        $keys = array_reverse($keys);

        foreach ($keys as $key) {
            $opts = &$uiBlockConfig['components'][$key];
            $type = $opts['type'] ?? '';

            if (!isset($elements[$key]) || empty($opts['template'])) {
                continue;
            }

            $templateCode = self::replaceTemplateVariables($opts['template'], $staticOptions);
            $result = $this->prepareHTMLByTemplate(
                $elements[$key],
                $templateCode,
                $key
            );

            $opts['outerHTML'] = self::replaceByTag($templateCode, $key, self::unescapeUrls($elements[$key]->outerHTML));

            if (!empty($opts['output'])) {
                $elements[$key] = self::replaceHTMLElement($elements[$key], $opts['output'], $key);
            }
        }
        return true;
    }

    /**
     * @param HTML5DOMElement $domElement
     * @param string $templateCode
     * @param string $key
     * @return bool
     */
    public function prepareHTMLByTemplate(&$domElement, $templateCode, $key)
    {
        if (!($domElement instanceof \DOMElement)
            && !($domElement instanceof HTML5DOMElement)
            && !($domElement instanceof \DOMText)) {
            return false;
        }

        $template = new HTML5DOMDocument();
        try {
            $template->loadXML('<body>' . $templateCode . '</body>');
        } catch (\Exception $e) {
            $this->setErrorMessage($e->getMessage());
            return false;
        }
        
        if (!($templateMainElement = self::findChildByTagName($template->querySelector('body'), $key))) {
            $this->setErrorMessage("Element \"{$key}\" not found in template.");
            return false;
        }

        self::copyAttributes($templateMainElement, $domElement);
        
        $hasChildHTML = false;
        if ($templateMainElement->hasChildNodes()) {
            foreach($templateMainElement->childNodes as $index => $tChildNode) {
                if ($tChildNode->nodeType === XML_ELEMENT_NODE) {
                    $hasChildHTML = true;
                    try {
                        $childNode = $domElement->querySelector($tChildNode->tagName);
                    } catch (\Exception $e) {
                        $childNode = null;
                    }
                    if ($childNode) {
                        self::copyAttributes($tChildNode, $childNode, true);
                        self::copyNextSiblings($tChildNode, $childNode);
                    } else {
                        self::copyAttributes($tChildNode, $domElement, true);
                    }
                }
            }
        }
        if (!$hasChildHTML) {
            self::copyAttributes($templateMainElement, $domElement, true);
        }
        
        return true;
    }

    /**
     * @param HTML5DOMElement $domElement
     * @return bool
     */
    public function isDinamic($domElement)
    {
        $dinamicParent = self::findDinamicParent($domElement);
        return !empty($dinamicParent);
    }

    /**
     * @param HTML5DOMElement $domElement
     * @return HTML5DOMElement
     */
    public static function findDinamicParent($domElement)
    {
        $commentOpen = self::getPreviousSiblingByType($domElement, XML_COMMENT_NODE);
        $commentClosed = self::getNextSiblingByType($domElement, XML_COMMENT_NODE);
        if ($commentOpen
            && $commentClosed
            && strpos($commentOpen->nodeValue, 'twv-include-') === false
            && strpos($commentOpen->nodeValue, 'twv-') !== false
            && strpos($commentClosed->nodeValue, '/twv-') !== false) {
                return $domElement;
        }
        return $domElement->parentNode
            ? self::findDinamicParent($domElement->parentNode)
            : null;
    }

    /**
     * @param string|null $environment
     * @return bool
     */
    public function systemCacheClear($environment = null)
    {
        if (!$environment) {
            $environment = $this->kernel->getEnvironment();
        }
        $application = new Application($this->kernel);
        $application->setAutoExit(false);

        $input = new ArrayInput([
            'command' => 'cache:clear',
            '--env' => $environment,
            '--quiet' => '1'
            // '--no-warmup' => '1'
        ]);

        $output = new BufferedOutput();
        $application->run($input, $output);
        $output->fetch();

        return $output->fetch() ?: true;
    }

    /**
     * Delete system cache files
     * @return bool
     */
    public function systemCacheFilesDelete($needReboot = true)
    {
        $cacheDirPath = $this->kernel->getCacheDir();
        $warmupDir = $cacheDirPath . '_';
        if (!is_dir($cacheDirPath)) {
            return true;
        }
        if (is_dir($warmupDir)) {
            self::delDir($warmupDir);
        }
        try {
            rename($cacheDirPath, $warmupDir);
            $result = true;
        } catch (\Exception $e) {
            $result = false;
        }
        if ($result && $needReboot) {
            $this->kernel->reboot($cacheDirPath);
        }
        return $result;
    }

    /**
     * @return bool
     */
    public function twigCacheClear()
    {
        $rootPath = $this->getRootDirPath();
        $environment = $this->kernel->getEnvironment();
        $cacheLocation = $this->getConfigValue('cache_location');
        
        foreach ($cacheLocation as $cacheLoc) {
            $cachePath = $rootPath . '/' . $cacheLoc;
            if (is_dir($cachePath)) {
                self::delDir($cachePath);
            } else if (is_file($cachePath) && is_writable($cachePath)) {
                unlink($cachePath);
            }
        }
        
        $this->systemCacheClear();

        return true;
    }

    /**
     * @param strin $outerHTML
     * @param strin $key
     * @param string $keyPrefix
     * @return string
     * @throws \Psr\Cache\InvalidArgumentException
     */
    public function cacheAdd($outerHTML, $key, $keyPrefix = 'twv-')
    {
        $themeDirPath = $this->getCurrentThemeDirPath();
        $cacheFilePath = $themeDirPath . DIRECTORY_SEPARATOR . 'twigvisual-data.yaml';
        if (file_exists($cacheFilePath) && !is_writable($cacheFilePath)) {
            throw new \Exception('Cache file is not writable.');
        }
        if (!file_exists($cacheFilePath) && !is_writable(dirname($cacheFilePath))) {
            throw new \Exception('Theme directory is not writable.');
        }
        $cacheContentArray = $this->cacheGet();
        $uniqid = uniqid($keyPrefix . $key . '-', true);
        
        $cacheContentArray[$uniqid] = str_replace("\r\n", "\n", $outerHTML);
        file_put_contents($cacheFilePath, Yaml::dump($cacheContentArray, 2, 4, Yaml::DUMP_MULTI_LINE_LITERAL_BLOCK));
        
        return $uniqid;
    }

    /**
     * @return array
     */
    public function cacheGet()
    {
        $themeDirPath = $this->getCurrentThemeDirPath();
        $cacheFilePath = $themeDirPath . DIRECTORY_SEPARATOR . 'twigvisual-data.yaml';
        if (!file_exists($cacheFilePath)) {
            return [];
        }
        return Yaml::parseFile($cacheFilePath) ?: [];
    }

    /**
     * @param Request $request
     * @return false|string
     */
    public function loadReferer(Request $request)
    {
        if ($request->server->get('HTTP_REFERER')) {
            return file_get_contents($request->server->get('HTTP_REFERER'));
        }
        return '';
    }

    /**
     * @param string $html
     * @return string
     */
    public function beautify($html)
    {
        $formatter = new Formatter();
        return $formatter
            ->setSpacesIndentationMethod(4)
            ->format($html);
    }

    /**
     * @param $themeName
     * @return string|null
     */
    public function getPublicTemplateDirPath($themeName)
    {
        if (!$themeName) {
            return null;
        }
        $publicDirPath = $this->getPublicDirPath();
        return $publicDirPath . '/assets/' . $themeName;
    }

    /**
     * @return string
     */
    public function getPublicDirPath()
    {
        return $this->params->has('app.web_dir_path')
            ? realpath($this->params->get('app.web_dir_path'))
            : realpath($this->getRootDirPath() . '/public');
    }

    /**
     * @return string
     * @throws \Twig\Error\LoaderError
     */
    public function getTemplatesDirPath()
    {
        return dirname(dirname($this->twig->getLoader()->getSourceContext('homepage.html.twig')->getPath()));
    }

    /**
     * @return string
     * @throws \Twig\Error\LoaderError
     */
    public function getCurrentThemeName()
    {
        $templatePath = dirname($this->twig->getLoader()->getSourceContext('homepage.html.twig')->getPath());
        return basename($templatePath);
    }

    /**
     * @return string
     * @throws \Twig\Error\LoaderError
     */
    public function getCurrentThemeDirPath()
    {
        return dirname($this->twig->getLoader()->getSourceContext('homepage.html.twig')->getPath());
    }

    /**
     * @return false|string
     */
    public function getRootDirPath()
    {
        return realpath($this->params->get('kernel.root_dir') . '/../..');
    }

    /**
     * @param \DOMElement|\DOMNode $element
     * @param string $content
     * @param string $tagName
     * @param string $cacheKey
     */
    public static function replaceHTMLElement($element, $content, $tagName = '', $cacheKey = '')
    {
        $result = null;
        if (!$element->parentNode) {
            return $result;
        }
        $isHTML = strpos(trim($content), '<') === 0;
        if ($isHTML) {
            $result = new HTML5DOMElement($tagName);//new \DOMElement($tagName);
            $element->parentNode->insertBefore($result, $element);
            $element->parentNode->removeChild($element);
        } else {
            $result = new \DOMText($content);
            $element->parentNode->insertBefore($result, $element);
            $element->parentNode->removeChild($element);
        }
        return $result;
    }

    /**
     * @param string $commentKey
     * @param string $content
     * @return string
     */
    public static function getCommentContent($commentKey, $content)
    {
        $o = strpos($content, "<!-- {$commentKey} -->") !== false
            ? "<!-- {$commentKey} -->"
            : "<!--{$commentKey}-->";
        $c = strpos($content, "<!-- /{$commentKey} -->") !== false
            ? "<!-- /{$commentKey} -->"
            : "<!--/{$commentKey}-->";
        $oPos = strpos($content, $o);
        $cPos = strpos($content, $c);
        if ($oPos !== false && $cPos !== false) {
            return str_replace($o, '', substr($content, $oPos, $cPos - $oPos));
        }
        return '';
    }

    /**
     * @param string $commentKey
     * @param string $content
     * @return string
     */
    public static function cutCommentContent($commentKey, $content)
    {
        $commentContent = self::getCommentContent($commentKey, $content);
        if ($commentContent) {
            return str_replace($commentContent, '', $content);
        }
        return $content;
    }

    /**
     * @param string $commentKey
     * @param string $commentContent
     * @param string $content
     * @param bool $removeComment
     * @return string
     */
    public static function replaceCommentContent($commentKey, $commentContent, $content, $removeComment = false)
    {
        $o = strpos($content, "<!-- {$commentKey} -->") !== false
            ? "<!-- {$commentKey} -->"
            : "<!--{$commentKey}-->";
        $c = strpos($content, "<!-- /{$commentKey} -->") !== false
            ? "<!-- /{$commentKey} -->"
            : "<!--/{$commentKey}-->";
        $oPos = strpos($content, $o);
        $cPos = strpos($content, $c);
        if ($oPos !== false && $cPos !== false) {
            if ($removeComment) {
                return substr($content, 0, $oPos) . $commentContent . substr($content, $cPos + strlen($c));
            }
            return substr($content, 0, $oPos) . $o . $commentContent . substr($content, $cPos);
        }
        return $content;
    }

    /**
     * @param string $commentKey
     * @param string $commentContent
     * @return string
     */
    public static function createCommentContent($commentKey, $commentContent)
    {
        return "<!-- {$commentKey} -->" . PHP_EOL . $commentContent
            . PHP_EOL . "<!-- /{$commentKey} -->";
    }

    /**
     * @param string $inputString
     * @param array $data
     * @return string|string[]
     */
    public static function replaceTemplateVariables($inputString, array $data)
    {
        foreach ($data as $key => $value) {
            $inputString = str_replace(["{{{$key}}}", "{{ {$key} }}"], $value, $inputString);
        }
        return $inputString;
    }

    /**
     * @param \DOMElement|\DOMNode $element
     * @param string $commentOpen
     * @param string $commentClose
     */
    public static function elementWrapComment($element, $commentOpen, $commentClose = '')
    {
        if (!$commentClose) {
            $commentClose = $commentOpen;
        }
        $element->parentNode->insertBefore(new \DOMText("\n"), $element);
        $element->parentNode->insertBefore(new \DOMComment(" {$commentOpen} "), $element);
        $element->parentNode->insertBefore(new \DOMText("\n"), $element);
        $element->parentNode->insertBefore(new \DOMComment(" /{$commentClose} "), $element->nextSibling);
        $element->parentNode->insertBefore(new \DOMText("\n"), $element->nextSibling);
    }

    /**
     * @param string $templateCode
     * @param string $tagName
     * @param string $content
     * @return string|string[]
     */
    public static function replaceByTag($templateCode, $tagName, $content)
    {
        if (strpos($templateCode, "<{$tagName}/>") !== false) {
            return str_replace("<{$tagName}/>", $content, $templateCode);
        }
        $regex = "/<{$tagName}[^>]*>(.*?)<\/{$tagName}>/s";
        if (!preg_match($regex, $templateCode)) {
            return $content;
        }
        return preg_replace("/<{$tagName}[^>]*>(.*?)<\/{$tagName}>/s", $content, $templateCode);
    }

    /**
     * Get file extension
     * @param string $filePath
     * @return string
     */
    public static function getExtension($filePath)
    {
        $temp_arr = $filePath ? explode('.', $filePath) : [];
        $ext = !empty($temp_arr) ? end($temp_arr) : '';
        return strtolower($ext);
    }

    /**
     * Recursively delete directory
     * @param $dir
     * @return bool
     */
    public static function delDir($dir) {
        $files = array_diff(scandir($dir), ['.','..']);
        foreach ($files as $file) {
            is_dir("$dir/$file")
                ? self::delDir("$dir/$file")
                : unlink("$dir/$file");
        }
        return rmdir($dir);
    }

    /**
     * @param string $inputXML
     * @param array $sourceArr
     * @param string $key
     * @return string
     */
    public static function replaceXMLTags($inputXML, $sourceArr, $key)
    {
        foreach ($sourceArr as $k => $opts) {
            if (!isset($opts[$key])) {
                continue;
            }
            $kLower = strtolower($k);
            $inputXML = str_replace(["<{$k}></{$k}>", "<{$kLower}></{$kLower}>"], $opts[$key], $inputXML);
        }
        return $inputXML;
    }

    /**
     * @param string $content
     * @return string
     */
    public static function unescapeUrls($content)
    {
        return str_replace(['%7B', '%7D', '%20'], ['{', '}', ' '], $content);
    }

    /**
     * @param \DOMElement|\DOMNode $sourceElement
     * @param \DOMElement|\DOMNode $targetElement
     * @param bool $includeTextContent
     */
    public static function copyAttributes($sourceElement, &$targetElement, $includeTextContent = false)
    {
        if ($sourceElement->hasAttributes()) {
            $attributes = $sourceElement->getAttributes();
            if (!empty($attributes)) {
                foreach ($attributes as $k => $attribute) {
                    if ($k === 'class') {
                        $classValue = $targetElement->getAttribute('class');
                        $classValue .= $classValue ? ' ' . $attribute : $attribute;
                        $targetElement->setAttribute($k, $classValue);
                    } else {
                        $targetElement->setAttribute($k, $attribute);
                    }
                }
            }
        }
        if ($includeTextContent) {
            $textNode = self::findChildByType($targetElement, XML_TEXT_NODE);
            if ($textNode) {
                $textNode->nodeValue = $sourceElement->textContent;
            } else {
                $targetElement->textContent = $sourceElement->textContent;
            }
        }
    }

    /**
     * @param \DOMElement|\DOMNode $sourceElement
     * @param \DOMElement|\DOMNode $targetElement
     */
    public static function copyNextSiblings($sourceElement, &$targetElement)
    {
        if ($tSibling = self::getNextSiblingByType($sourceElement, XML_TEXT_NODE)) {
            if ($targetElement->parentNode && $targetElement->nextSibling) {
                $newText = new \DOMText($tSibling->nodeValue);
                $targetElement->parentNode->insertBefore($newText, $targetElement->nextSibling);
            }
        }
    }

    /**
     * @param mixed $domElement
     * @param int $type
     * @return \DOMElement|\DOMNode|null
     */
    public static function getNextSiblingByType($domElement, $type = XML_ELEMENT_NODE)
    {
        if (!($domElement instanceof \DOMElement)
            && !($domElement instanceof HTML5DOMElement)
            && !($domElement instanceof \DOMText)) {
                return null;
        }
        if ($domElement->nextSibling && $domElement->nextSibling->nodeType !== $type) {
            return self::getNextSiblingByType($domElement->nextSibling, $type);
        }
        return $domElement->nextSibling;
    }

    /**
     * @param mixed $domElement
     * @param int $type
     * @return \DOMElement|\DOMNode|null
     */
    public static function getPreviousSiblingByType($domElement, $type = XML_ELEMENT_NODE)
    {
        if (!($domElement instanceof \DOMElement)
            && !($domElement instanceof HTML5DOMElement)
            && !($domElement instanceof \DOMText)) {
            return null;
        }
        if ($domElement->previousSibling && $domElement->previousSibling->nodeType !== $type) {
            return self::getPreviousSiblingByType($domElement->previousSibling, $type);
        }
        return $domElement->previousSibling;
    }

    /**
     * @param mixed $domElement
     * @param int $type
     * @return |null
     */
    public static function findChildByType($domElement, $type = XML_ELEMENT_NODE)
    {
        if (!($domElement instanceof \DOMElement)
            && !($domElement instanceof HTML5DOMElement)
            && !($domElement instanceof \DOMText)) {
            return null;
        }
        if (!$domElement->hasChildNodes()) {
            return null;
        }
        $childNodes = $domElement->childNodes;
        $result = null;
        foreach ($childNodes as $childNode) {
            if ($childNode->nodeType === $type) {
                $result = $childNode;
                break;
            }
        }
        return $result;
    }

    /**
     * @param mixed $domElement
     * @param int $tagName
     * @return |null
     */
    public static function findChildByTagName($domElement, $tagName)
    {
        if (!($domElement instanceof \DOMElement)
            && !($domElement instanceof HTML5DOMElement)
            && !($domElement instanceof \DOMText)) {
            return null;
        }
        if (!$domElement->hasChildNodes()) {
            return null;
        }
        $childNodes = $domElement->childNodes;
        $result = null;
        foreach ($childNodes as $childNode) {
            if ($childNode->nodeName === $tagName) {
                $result = $childNode;
                break;
            }
        }
        return $result;
    }

    /**
     * @param HTML5DOMElement $domElement
     * @param $styleName
     * @param $value
     */
    public static function updateStyles(\IvoPetkov\HTML5DOMElement $domElement, $styleName, $value)
    {
        $stylesString = $domElement->hasAttribute('style')
            ? $domElement->getAttribute('style')
            : '';
        $stylesArr = $stylesString ? explode(';', $stylesString) : [];
        $stylesArr = array_map('trim', $stylesArr);
        $stylesArr = array_filter($stylesArr, function($item) {
            return !empty($item);
        });
        
        $styleCurrent = array_filter($stylesArr, function($item) use ($styleName) {
            return strpos($item, $styleName) !== false;
        });
        if (!empty($styleCurrent)) {
            $newStyleString = "{$styleName}: {$value}";
            $keys = array_keys($styleCurrent);
            $stylesArr[$keys[0]] = $newStyleString;
        } else {
            $stylesArr[] = "{$styleName}: {$value}";
        }
        
        $domElement->setAttribute('style', implode('; ', $stylesArr));
    }

    /**
     * @param HTML5DOMElement $doc
     * @param string $xpathQuery
     */
    public static function findElementByXPath(\IvoPetkov\HTML5DOMDocument $doc, $xpathQuery)
    {
        $xpath = new \DOMXPath($doc);
        /** @var \DOMNodeList $entries */
        $entries = $xpath->evaluate($xpathQuery, $doc);
        return $entries->count() > 0 ? $entries->item(0) : null;
    }
    
    /**
     * @param array $data
     * @return array
     */
    public static function getDataKeys($data)
    {
        $output = [];

        foreach ($data as $key => $val) {
            if (gettype($val) === 'array' && TwigVisualService::isAssoc($val)) {
                foreach ($val as $k => $v) {
                    $output[] = [
                        'name' => $key . '.' . $k,
                        'type' => gettype($v)
                    ];
                }
            }
            else if (gettype($val) === 'object' && method_exists($val, 'toArray')) {
                foreach ($val->toArray() as $k => $v) {
                    $output[] = [
                        'name' => $key . '.' . $k,
                        'type' => gettype($v)
                    ];
                }
            }
            else if ($key === 'app' && $val instanceof AppVariable) {
                $output[] = [
                    'name' => $key . '.user',
                    'type' => method_exists($val, 'getUser') ? gettype($val->getUser()) : 'null'
                ];
                $output[] = [
                    'name' => $key . '.request',
                    'type' => method_exists($val, 'getRequest') ? gettype($val->getRequest()) : 'null'
                ];
                $output[] = [
                    'name' => $key . '.session',
                    'type' => method_exists($val, 'getSession') ? gettype($val->getSession()) : 'null'
                ];
                $output[] = [
                    'name' => $key . '.flashes',
                    'type' => method_exists($val, 'getFlashes') ? gettype($val->getFlashes()) : 'null'
                ];
                $output[] = [
                    'name' => $key . '.environment',
                    'type' => method_exists($val, 'getEnvironment') ? gettype($val->getEnvironment()) : 'null'
                ];
            }
            else {
                $output[] = [
                    'name' => $key,
                    'type' => gettype($val)
                ];
            }
        }
        
        return $output;
    }

    /**
     * @param array $arr
     * @return bool
     */
    public static function isAssoc(array $arr)
    {
        if (array() === $arr) return false;
        return array_keys($arr) !== range(0, count($arr) - 1);
    }
}
