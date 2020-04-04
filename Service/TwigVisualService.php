<?php

namespace Andchir\TwigVisualBundle\Service;

use Symfony\Bundle\FrameworkBundle\Console\Application;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use Symfony\Component\HttpKernel\KernelInterface;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Output\BufferedOutput;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Bridge\Twig\AppVariable;
use Symfony\Component\Cache\Adapter\FilesystemAdapter;
use Doctrine\Common\Persistence\ObjectManager;
use Doctrine\Common\Persistence\ObjectRepository;
use Twig\Environment as TwigEnvironment;
use XhtmlFormatter\Formatter;
use IvoPetkov\HTML5DOMDocument;

class TwigVisualService {

    /** @var TwigEnvironment */
    protected $twig;
    /** @var ParameterBagInterface */
    protected $params;
    /** @var KernelInterface */
    protected $kernel;
    /** @var array */
    protected $config;
    /** @var FilesystemAdapter */
    protected $cache;
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

        $this->cache = new FilesystemAdapter('twigvisualcache', 0, $this->getRootDirPath() . '/var/cache');
        
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
                    'type' => $v['type']
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
                $sourceFilePath .= '.html.twig';
                $targetFilePath .= '.html.twig';
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
    public function deleteElement($templateName, $xpathQuery)
    {
        try {
            $result = $this->getDocumentNode($templateName, $xpathQuery, true);
        } catch (\Exception $e) {
            $this->setErrorMessage($e->getMessage());
            return false;
        }
        list($templateFilePath, $doc, $node) = $result;

        try {
            $node->parentNode->removeChild($node);
        } catch (\Exception $e) {
            $this->setErrorMessage($e->getMessage());
            return false;
        }
        
        return $this->saveTemplateContent($doc, $templateFilePath);
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

        file_put_contents($templateFilePath, $htmlContent);

        if ($clearCache) {
            $this->twigCacheClear();
        }
        return true;
    }

    /**
     * @param string $templateName
     * @param string|null $xpathQuery
     * @param bool $checkIsVisualized
     * @return array
     * @throws \Psr\Cache\InvalidArgumentException
     * @throws \Twig\Error\LoaderError
     * @throws \Twig\Error\SyntaxError
     */
    public function getDocumentNode($templateName, $xpathQuery = null, $checkIsVisualized = false)
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
        if ($checkIsVisualized && $this->isVisualized($node)) {
            throw new \Exception('The item is already visualized.');
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

        if ($replaceFromCache) {
            $cacheItem = $this->cache->getItem($this->getCurrentThemeName());
            $cacheContentArray = $cacheItem->isHit() ? $cacheItem->get() : [];
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
            switch ($uiBlockConfig['components'][$key]['type']) {
                case 'elementSelect':
                    $xpath = new \DOMXPath($doc);
                    /** @var \DOMNodeList $entries */
                    $entries = $xpath->evaluate($xpathQuery, $doc);
                    if ($entries->count() === 0) {
                        return $this->setErrorMessage("Element ({$key}) not found for xPath: {$xpathQuery}.");
                    }
                    $elements[$key] = $entries->item(0);
                    $uiBlockConfig['components'][$key]['sourceHTML'] = $elements[$key]->outerHTML;
                    
                    break;
                case 'pageField':



                    break;
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
        foreach ($uiBlockConfig['components'] as $key => &$opts) {
            if (!isset($opts['type'])) {
                continue;
            }
            switch ($opts['type']) {
                case 'text':
                    if (isset($data['data'][$key])) {
                        $opts['value'] = $data['data'][$key];
                    }
                    break;
                case 'elementSelect':
                    if (isset($opts['template'])) {
                        $opts['template'] = self::replaceTemplateVariables($opts['template'], $data['data']);
                    }
                    break;
            }
        }
    }
    
    /**
     * @param array $uiBlockConfig
     * @param array $elements
     * @return bool
     */
    public function prepareOptionsByTemplates(&$uiBlockConfig, &$elements)
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
            switch ($type) {
                case 'elementSelect':

                    if (!isset($elements[$key]) || !isset($opts['template'])) {
                        break;
                    }
                    
                    $templateCode = self::replaceTemplateVariables($opts['template'], $staticOptions);
                    $result = $this->prepareHTMLByTemplate(
                        $elements[$key],
                        $templateCode,
                        $key
                    );

                    $opts['outerHTML'] = self::replaceByTag($templateCode, $key, self::unescapeUrls($elements[$key]->outerHTML));
                    
                    if ($key !== 'root' && !empty($opts['src'])) {
                        $elements[$key] = self::replaceHTMLElement($elements[$key], $opts['src'], $key);
                    }

                    break;
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
        
        if ($templateMainElement->hasChildNodes()) {
            foreach($templateMainElement->childNodes as $index => $tChildNode) {
                if ($tChildNode->nodeType === XML_ELEMENT_NODE) {
                    try {
                        $childNode = $domElement->querySelector($tChildNode->tagName);
                    } catch (\Exception $e) {
                        $childNode = null;
                    }
                    if ($childNode) {
                        self::copyAttributes($tChildNode, $childNode, true);
                        self::copyNextSiblings($tChildNode, $childNode);
                    }
                }
            }
        }
        
        return true;
    }

    /**
     * @param $domElement
     * @return bool
     */
    public function isVisualized($domElement)
    {
        $commentOpen = self::getPreviousSiblingByType($domElement, XML_COMMENT_NODE);
        $commentClosed = self::getNextSiblingByType($domElement, XML_COMMENT_NODE);
        if ($commentOpen
            && $commentClosed
            && strpos($commentOpen->nodeValue, 'twv-') !== false
            && strpos($commentClosed->nodeValue, '/twv-') !== false) {
                return true;
        }
        return $domElement->parentNode
            ? $this->isVisualized($domElement->parentNode)
            : false;
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
     * @param string $itemKey
     * @param string $keyPrefix
     * @return string
     * @throws \Psr\Cache\InvalidArgumentException
     */
    public function cacheAdd($outerHTML, $key, $itemKey = 'templateData', $keyPrefix = 'twv-')
    {
        $uniqid = uniqid($keyPrefix . $key . '-', true);
        $cacheItem = $this->cache->getItem($itemKey);
        if ($cacheItem) {
            $cacheContentArray = $cacheItem->isHit() ? $cacheItem->get() : [];
            $cacheContentArray[$uniqid] = $outerHTML;
            
            $cacheItem->set($cacheContentArray);
            $this->cache->save($cacheItem);
        }
        return $uniqid;
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
        $isHTML = strpos(trim($content), "<{$tagName}") === 0;
        if ($isHTML) {
            $result = new \DOMElement($tagName);
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
     * @return string
     */
    public static function replaceCommentContent($commentKey, $commentContent, $content)
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
        return PHP_EOL . "<!-- {$commentKey} -->" . PHP_EOL . $commentContent
            . PHP_EOL . "<!-- /{$commentKey} -->" . PHP_EOL;
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
        if (!$sourceElement->hasAttributes()) {
            return;
        }
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
        if ($includeTextContent) {
            $targetElement->textContent = $sourceElement->textContent;
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
     * @param HTML5DOMElement $doc
     * @param string $xpathQuery
     */
    public static function fintElementByXPath(\IvoPetkov\HTML5DOMDocument $doc, $xpathQuery)
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
