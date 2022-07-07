<?php

namespace Andchir\TwigVisualBundle\Controller;

use Andchir\TwigVisualBundle\Service\TwigVisualService;
use App\Service\UtilsService;
use IvoPetkov\HTML5DOMDocument;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\IsGranted;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Yaml\Yaml;
use Symfony\Contracts\Translation\TranslatorInterface;

/**
 * Class DefaultController
 * @package Andchir\TwigVisualBundle\Controller
 *
 * @Route("/twigvisual")
 */
class DefaultController extends AbstractController
{
    /** @var TwigVisualService */
    protected $service;
    /** @var TranslatorInterface */
    protected $translator;
    /** @var ParameterBagInterface */
    protected $params;

    public function __construct(
        TwigVisualService $service,
        TranslatorInterface $translator,
        ParameterBagInterface $params
    )
    {
        $this->service = $service;
        $this->translator = $translator;
        $this->params = $params;
    }

    /**
     * @Route("/create", methods={"POST"})
     * @IsGranted("ROLE_ADMIN")
     * @return JsonResponse
     * @throws \Twig\Error\LoaderError
     */
    public function createThemeAction(Request $request)
    {
        try {
            $data = $this->getRequestData($request, false, false);
        } catch (\Exception $e) {
            return $this->setError($this->translator->trans($e->getMessage()));
        }
        
        $themeName = $data['theme'];
        $mainpage = $data['mainpage'];

        $templatesDirPath = $this->service->getTemplatesDirPath();
        $publicTemplateDirPath = $this->service->getPublicTemplateDirPath($themeName);
        
        if (!is_dir($publicTemplateDirPath)) {
            return $this->setError($this->translator->trans('Please upload the template files (HTML, CSS, images) at "%themePath%".', [
                '%themePath%' => str_replace($this->service->getRootDirPath(), '', $publicTemplateDirPath)
            ]));
        }

        $mainPagePublicFilePath = $publicTemplateDirPath . DIRECTORY_SEPARATOR . $mainpage;
        if (TwigVisualService::getExtension($mainpage) !== 'html') {
            return $this->setError($this->translator->trans('The main page file must be of type HTML.'));
        }
        if (!$mainpage || !file_exists($mainPagePublicFilePath)) {
            return $this->setError($this->translator->trans('Home page file not found.'));
        }

        $templateDirPath = $templatesDirPath . DIRECTORY_SEPARATOR . $themeName;
        $mainPageTemplateFilePath = $templateDirPath . DIRECTORY_SEPARATOR . 'homepage';
        $mainPageTemplateFilePath .= '.' . $this->service->getConfigValue('templates_extension');
        
        if (!$this->service->copyDefaultFiles($themeName)) {
            return $this->setError($this->translator->trans('Error copying files by default.'));
        }
        if (!is_dir($templateDirPath)) {
            mkdir($templateDirPath);
        }

        // Create data file
        $cacheFilePath = $this->service->getDataFilePath($themeName);
        if (file_exists($cacheFilePath) && is_writable($cacheFilePath)) {
            unlink($cacheFilePath);
        }
        file_put_contents($cacheFilePath, '');
        
        $templateContent = $this->service->prepareTemplateContent($mainPagePublicFilePath, $themeName);
        file_put_contents($mainPageTemplateFilePath, $templateContent);
        
        return $this->json([
            'success' => true,
            'message' => $this->translator->trans('Templates theme created successfully.')
        ]);
    }

    /**
     * @Route("/create_template", methods={"POST"})
     * @IsGranted("ROLE_ADMIN")
     * @return JsonResponse
     * @throws \Twig\Error\LoaderError
     */
    public function createTemplateAction(Request $request)
    {
        try {
            $data = $this->getRequestData($request, false, false);
        } catch (\Exception $e) {
            return $this->setError($this->translator->trans($e->getMessage()));
        }
        $templateName = $data['templateName'];
        $fileName = $data['fileName'] ?? '';

        $themeName = $this->service->getCurrentThemeName();
        $templatesDirPath = $this->service->getTemplatesDirPath();
        $publicTemplateDirPath = $this->service->getPublicTemplateDirPath($themeName);

        if (!$templateName) {
            return $this->setError($this->translator->trans('Template name can not be empty.'));
        }
        if (!is_dir($publicTemplateDirPath)) {
            return $this->setError($this->translator->trans('Please upload the template files (HTML, CSS, images) at "%themePath%".', [
                '%themePath%' => str_replace($this->service->getRootDirPath(), '', $publicTemplateDirPath)
            ]));
        }

        $templateFilePath = $templatesDirPath . DIRECTORY_SEPARATOR . $themeName . DIRECTORY_SEPARATOR  . $templateName;
        $templateFilePath .= '.' . $this->service->getConfigValue('templates_extension');
        $pagePublicFilePath = $publicTemplateDirPath . DIRECTORY_SEPARATOR . $fileName;
        if (TwigVisualService::getExtension($fileName) !== 'html') {
            return $this->setError($this->translator->trans('The main page file must be of type HTML.'));
        }
        if (!$fileName || !file_exists($pagePublicFilePath)) {
            return $this->setError($this->translator->trans('Page HTML file not found.'));
        }

        if (!is_dir(dirname($templateFilePath))) {
            mkdir(dirname($templateFilePath));
        }

        $templateContent = $this->service->prepareTemplateContent($pagePublicFilePath, $themeName);
        file_put_contents($templateFilePath, $templateContent);
        
        return $this->json([
            'success' => true,
            'message' => $this->translator->trans('Template created successfully.')
        ]);
    }

    /**
     * @Route("/edit_content", methods={"POST"})
     * @IsGranted("ROLE_ADMIN")
     * @param Request $request
     * @return JsonResponse
     * @throws \Psr\Cache\InvalidArgumentException
     * @throws \Twig\Error\LoaderError
     */
    public function editTextContentAction(Request $request)
    {
        try {
            $data = $this->getRequestData($request);
        } catch (\Exception $e) {
            return $this->setError($this->translator->trans($e->getMessage()));
        }
        $templateName = $data['templateName'];
        $xpath = $data['xpath'];
        $textContent = $data['textContent'] ?? '';
        
        if (!$this->service->editTextContent($templateName, $xpath, $textContent)) {
            return $this->setError($this->service->getErrorMessage());
        }
        return $this->json([
            'success' => true
        ]);
    }

    /**
     * @Route("/edit_link", methods={"POST"})
     * @IsGranted("ROLE_ADMIN")
     * @param Request $request
     * @return JsonResponse
     * @throws \Psr\Cache\InvalidArgumentException
     * @throws \Twig\Error\LoaderError
     */
    public function editLinkAction(Request $request)
    {
        try {
            $data = $this->getRequestData($request);
        } catch (\Exception $e) {
            return $this->setError($this->translator->trans($e->getMessage()));
        }
        $templateName = $data['templateName'];
        $xpath = $data['xpath'];
        $href = $data['href'] ?? '';
        $target = $data['target'] ?? '_self';
        
        if (!$this->service->editAttributes($templateName, $xpath, [
            'href' => $href,
            'target' => $target
        ])) {
            return $this->setError($this->service->getErrorMessage());
        }
        return $this->json([
            'success' => true
        ]);
    }

    /**
     * @Route("/replace_image", methods={"POST"})
     * @IsGranted("ROLE_ADMIN")
     * @param Request $request
     * @return JsonResponse
     * @throws \Psr\Cache\InvalidArgumentException
     * @throws \Twig\Error\LoaderError
     */
    public function replaceImageAction(Request $request)
    {
        try {
            $data = $this->getRequestData($request, true, true, true);
        } catch (\Exception $e) {
            return $this->setError($this->translator->trans($e->getMessage()));
        }
        $templateName = $data['templateName'];
        $xpath = $data['xpath'];
        $attributeName = $request->get('attributeName', 'src');
        /** @var UploadedFile $imageFile */
        $imageFile = $request->files->get('imageFile');
        
        if (!$imageFile) {
            return $this->setError($this->translator->trans('Image file has not been uploaded.'));
        }
        if (!in_array(UtilsService::getExtension($imageFile->getClientOriginalName()), ['jpg','jpeg','png','gif'])) {
            return $this->setError($this->translator->trans('File type is not allowed.'));
        }
        
        $fileName = $imageFile->getClientOriginalName();
        $ext = UtilsService::getExtension($fileName);
        $baseUrl = $request->getBaseUrl();
        $rootPath = $this->service->getParameter('kernel.project_dir');
        $dirPath = $this->service->getConfigValue('file_upload_dir_path');
        $dirUrl = $baseUrl . str_replace($rootPath . DIRECTORY_SEPARATOR . 'public', '', $dirPath);
        if (file_exists($dirPath . DIRECTORY_SEPARATOR . $fileName)) {
            $fileName = str_replace('.' . $ext, '_' . uniqid() . '.' . $ext, $fileName);
        }
        try {
            $imageFile->move($dirPath, $fileName);
        } catch (\Exception $e) {
            return $this->setError($e->getMessage());
        }

        $imageUrl = $dirUrl . DIRECTORY_SEPARATOR . $fileName;
        $value = $imageUrl;
        if ($attributeName === 'style') {
            $value = "background-image: url(\"{$imageUrl}\");";
        }
        if (!$this->service->editAttributes($templateName, $xpath, [
            $attributeName => $value
        ])) {
            return $this->setError($this->translator->trans($this->service->getErrorMessage()));
        }

        return $this->json([
            'success' => true
        ]);
    }

    /**
     * @Route("/delete_element", methods={"POST"})
     * @IsGranted("ROLE_ADMIN")
     * @param Request $request
     * @return JsonResponse
     * @throws \Psr\Cache\InvalidArgumentException
     * @throws \Twig\Error\LoaderError
     */
    public function deleteElementAction(Request $request)
    {
        try {
            $data = $this->getRequestData($request);
        } catch (\Exception $e) {
            return $this->setError($this->translator->trans($e->getMessage()));
        }
        $templateName = $data['templateName'];
        $xpath = $data['xpath'];
        $clean = $data['clean'] ?? false;
        
        $this->service->setRefererUrl($request->server->get('HTTP_REFERER'));
        if (!$this->service->deleteTemplateElement($templateName, $xpath, $clean)) {
            return $this->setError($this->service->getErrorMessage());
        }
        return $this->json([
            'success' => true
        ]);
    }

    /**
     * @Route("/create_component/{actionName}", methods={"POST"})
     * @IsGranted("ROLE_ADMIN")
     * @param Request $request
     * @param string $actionName
     * @return JsonResponse
     * @throws \Psr\Cache\InvalidArgumentException
     * @throws \Twig\Error\LoaderError
     */
    public function insertAction(Request $request, $actionName)
    {
        try {
            $data = $this->getRequestData($request, true, false);
        } catch (\Exception $e) {
            return $this->setError($this->translator->trans($e->getMessage()));
        }
        $templateName = $data['templateName'];
        $uiBlockConfig = $this->service->getConfigValue('ui', $actionName,  []);
        
        if (!isset($data['data']) || !isset($data['data']['source'])) {
            return $this->setError($this->translator->trans('Please select a root item.'));
        }
        
        // Update configuration
        if (!empty($uiBlockConfig['configuration']) && is_array($uiBlockConfig['configuration'])) {
            foreach ($uiBlockConfig['configuration'] as $key => $val) {
                $this->service->setConfigValue($key, $val);
            }
        }
        
        try {
            $result = $this->service->getDocumentNode($templateName, $data['data']['source']['xpath'], true);
        } catch (\Exception $e) {
            return $this->setError($e->getMessage());
        }
        /** @var HTML5DOMDocument $doc */
        list($templateFilePath, $doc, $node) = $result;
        $templateDirPath = dirname($templateFilePath);
        
        // Step #1
        $elements = $this->service->getUiElements($doc, $data, $uiBlockConfig);
        if ($this->service->getIsError()) {
            return $this->setError($this->service->getErrorMessage());
        }
        $elements['root'] = $node;
        $uiBlockConfig['components']['root']['sourceHTML'] = $node->outerHTML;
        $configKeys = array_keys($uiBlockConfig['components']);
        
        // Step #2
        $this->service->prepareOptionsByValues($uiBlockConfig, $data);
        
        // Step #3
        if (!$this->service->prepareOptionsByTemplates($uiBlockConfig, $elements, $templateName)) {
            return $this->setError($this->service->getErrorMessage());
        }

        switch ($actionName) {
            case 'include':
            case 'includeCreate':
                
                $includeTemplateName = $data['data']['includeName'] ?? '';
                if (!$includeTemplateName) {
                    break;
                }
                $templatesExtension = $this->service->getConfigValue('templates_extension');
                $themeDirPath = $this->service->getCurrentThemeDirPath();
                $includes = $this->service->getIncludesList(true);
                $templatePath = $themeDirPath . DIRECTORY_SEPARATOR . TwigVisualService::INCLUDES_DIRNAME;
                $templatePath .= DIRECTORY_SEPARATOR . $includeTemplateName . '.' . $templatesExtension;
                
                if ($actionName == 'includeCreate') {
                    if (!is_dir(dirname($templatePath))) {
                        mkdir(dirname($templatePath));
                    }
                    file_put_contents($templatePath, '');
                } else if (!in_array($includeTemplateName, $includes) || !file_exists($templatePath)) {
                    break;
                }
                $commentKey = 'twv-include-' . TwigVisualService::INCLUDES_DIRNAME . DIRECTORY_SEPARATOR;
                $commentKey .= $includeTemplateName . '.' . $templatesExtension;

                $this->service->elementWrapComment($elements['root'], $commentKey);

                break;
            case 'translatedText':

                $rootPath = $this->service->getParameter('kernel.project_dir');
                $localeFallback = 'en';
                $textDefault = $data['data']['text_en'] ?? '';

                if ($textDefault) {
                    foreach ($data['data'] as $key => $value) {
                        if (strpos($key, 'text_') === false) {
                            continue;
                        }
                        list($keyName, $langName) = explode('_', $key);
                        if ($langName == $localeFallback) {
                            continue;
                        }
                        $langFilePath = $rootPath . "/translations/messages.{$langName}.yaml";
                        $langData = file_exists($langFilePath) ? Yaml::parseFile($langFilePath) : [];
                        $langData[$textDefault] = $value;

                        if (file_exists($langFilePath) && !is_writable($langFilePath)) {
                            return $this->setError($this->translator->trans('File is not writable: %fileName%', [
                                '%fileName%' => "messages.{$langName}.yaml"
                            ]));
                        }

                        file_put_contents($langFilePath, Yaml::dump($langData, 2, 4, Yaml::DUMP_MULTI_LINE_LITERAL_BLOCK));
                    }
                }
                break;
        }
        
        // Step #4
        foreach ($uiBlockConfig['components'] as $key => $opts) {
            if (!isset($opts['type'])) {
                continue;
            }
            if (!empty($opts['styleName'])) {
                TwigVisualService::updateStyles($elements['root'], $opts['styleName'], $opts['value']);
            }
            if (!empty($opts['outerHTML'])) {
                $outerHTML = TwigVisualService::replaceXMLTags(
                    $opts['outerHTML'],
                    $uiBlockConfig['components'],
                    'outerHTML'
                );
                if (TwigVisualService::isMultiline($uiBlockConfig['components']['root']['template'])) {
                    $outerHTML = $this->service->beautify($outerHTML);
                }
                $outerHTML = TwigVisualService::prepareTwigTags($outerHTML);
                
                if (!empty($opts['saveBackupCopy'])) {
                    try {
                        $cacheKey = $this->service->cacheAdd(
                            $opts['sourceHTML'],
                            $templateName . '-' . $actionName . '-' . $key
                        );
                    } catch (\Exception $e) {
                        return $this->setError($e->getMessage());
                    }
                    TwigVisualService::elementWrapComment($elements[$key], $cacheKey);
                }
                if (!empty($opts['templatePath'])) {
                    $tplFilePath = $templateDirPath . DIRECTORY_SEPARATOR .  $opts['templatePath'];
                    $tplFilePath .= '.' . $this->service->getConfigValue('templates_extension');

                    if (!is_dir(dirname($tplFilePath))) {
                        mkdir(dirname($tplFilePath));
                    }
                    if (file_exists($tplFilePath)) {
                        unlink($tplFilePath);
                    }
                    file_put_contents($tplFilePath, $outerHTML);
                } else {
                    try {
                        $elements[$key]->outerHTML = $outerHTML;
                    } catch (\Exception $e) {
                    
                    }
                }
            }
        }

        // var_dump($uiBlockConfig['components']); exit;

        try {
            $this->service->saveTemplateContent($doc, $templateFilePath);
        } catch (\Exception $e) {
            return $this->setError($e->getMessage());
        }
        
        return $this->json([
            'success' => true
        ]);
    }

    /**
     * @Route("/move_element/{actionName}", defaults={"actionName": ""}, methods={"POST"})
     * @IsGranted("ROLE_ADMIN")
     * @param Request $request
     * @param $actionName
     * @return JsonResponse
     * @throws \Psr\Cache\InvalidArgumentException
     * @throws \Twig\Error\LoaderError
     */
    public function moveElementAction(Request $request, $actionName)
    {
        try {
            $data = $this->getRequestData($request, true, false);
        } catch (\Exception $e) {
            return $this->setError($this->translator->trans($e->getMessage()));
        }
        $templateName = $data['templateName'];
        $xpath = $data['xpath'];
        $xpathTarget = $data['xpathTarget'] ?? ($data['data']['source'] ?? '');
        $insertMode = $data['insertMode'] ?? ($data['data']['insertMode'] ?? TwigVisualService::INSERT_MODE_AFTER);
        $insertContent = '';

        // Insert ready made code
        if (empty($xpath) && !empty($actionName)) {
            $uiBlockConfig = $this->service->getConfigValue('ui', $actionName,  []);
            $insertContent = $uiBlockConfig['components']['root']['output'] ?? '';

            // Update configuration
            if (!empty($uiBlockConfig['configuration']) && is_array($uiBlockConfig['configuration'])) {
                foreach ($uiBlockConfig['configuration'] as $key => $val) {
                    $this->service->setConfigValue($key, $val);
                }
            }
        }

        if (!($result = $this->service->moveElement($templateName, $xpath, $xpathTarget, $insertMode, $insertContent))) {
            return $this->setError($this->translator->trans($this->service->getErrorMessage()));
        }

        return $this->json([
            'success' => true
        ]);
    }

    /**
     * @Route("/includes", methods={"GET"})
     * @IsGranted("ROLE_ADMIN")
     * @param Request $request
     * @return JsonResponse
     * @throws \Twig\Error\LoaderError
     */
    public function includesListAction(Request $request)
    {
        return $this->json([
            'templates' => $this->service->getIncludesList(true)
        ]);
    }

    /**
     * @Route("/html_files", methods={"GET"})
     * @IsGranted("ROLE_ADMIN")
     * @param Request $request
     * @return JsonResponse
     * @throws \Twig\Error\LoaderError
     */
    public function htmlFilesListAction()
    {
        $publicTemplateDirPath = $this->service->getPublicTemplateDirPath($this->service->getCurrentThemeName());
        $files = [];
        if (is_dir($publicTemplateDirPath)) {
            $files = array_slice(scandir($publicTemplateDirPath), 2);
            $files = array_values(array_filter($files, function ($fileName) {
                return strpos($fileName, '.html') !== false;
            }));
            sort($files);
        }
        return $this->json([
            'files' => $files
        ]);
    }

    /**
     * @Route("/batch", methods={"POST"})
     * @IsGranted("ROLE_ADMIN")
     * @param Request $request
     * @return JsonResponse
     * @throws \Psr\Cache\InvalidArgumentException
     * @throws \Twig\Error\LoaderError
     */
    public function batchAction(Request $request)
    {
        try {
            $data = $this->getRequestData($request, true, false);
        } catch (\Exception $e) {
            return $this->setError($this->translator->trans($e->getMessage()));
        }
        $templateName = $data['templateName'];
        $actions = $data['actions'] ?? [];

        try {
            $result = $this->service->getDocumentNode($templateName, null, true);
        } catch (\Exception $e) {
            return $this->setError($e->getMessage());
        }
        list($templateFilePath, $doc) = $result;
        
        $errors = [];
        $elements = [];
        foreach ($actions as $action) {
            if (empty($action['xpath']) || empty($action['action'])) {
                $elements[] = null;
                continue;
            }
            $node = TwigVisualService::findElementByXPath($doc, $action['xpath']);
            if ($this->service->isDinamic($node)) {
                $errors[] = $this->translator->trans('The item is already dynamic.');
            } else {
                $elements[] = $node;
            }
        }

        if (count($errors) > 1) {
            return $this->setError($errors[0]);
        }
        foreach ($actions as $index => $action) {
            if (empty($action['action']) || !$elements[$index]) {
                continue;
            }
            $options = $action['options'] ?? [];
            switch ($action['action']) {
                case 'edit_content':
                    
                    $innerHTML = $options['value'] ?? '';
                    $elements[$index]->innerHTML = $innerHTML;
                    
                    break;
                case 'edit_link':

                    $attributes = [
                        'href' => $options['href'] ?? '',
                        'target' => $options['target'] ?? ''
                    ];
                    try {
                        foreach ($attributes as $key => $value) {
                            $elements[$index]->setAttribute($key, $value);
                        }
                    } catch (\Exception $e) {
                        $errors[] = $e->getMessage();
                    }

                    break;
                case 'delete':
                    try {
                        $elements[$index]->parentNode->removeChild($elements[$index]);
                    } catch (\Exception $e) {
                        $errors[] = $e->getMessage();
                    }
                    break;
            }
        }
        
        if (count($errors) > 1) {
            return $this->setError($errors[0]);
        }

        try {
            $this->service->saveTemplateContent($doc, $templateFilePath);
        } catch (\Exception $e) {
            return $this->setError($e->getMessage());
        }
        
        return $this->json([
            'success' => true
        ]);
    }

    /**
     * @Route("/restore_backup", methods={"POST"})
     * @IsGranted("ROLE_ADMIN")
     * @param Request $request
     * @return JsonResponse
     * @throws \Twig\Error\LoaderError
     */
    public function restoreBackupAction(Request $request)
    {
        try {
            $data = $this->getRequestData($request, true, false);
        } catch (\Exception $e) {
            return $this->setError($this->translator->trans($e->getMessage()));
        }
        $templateName = $data['templateName'];

        $themeDirPath = $this->service->getCurrentThemeDirPath();
        $templatePath = $themeDirPath . DIRECTORY_SEPARATOR . $templateName;
        
        if (!file_exists($templatePath)) {
            return $this->setError($this->translator->trans('Template not found.'));
        }

        $recordId = 'backup-copy-' . $templateName;
        $cacheContentArray = $this->service->cacheGet();
        if (!isset($cacheContentArray[$recordId])) {
            return $this->setError($this->translator->trans('Backup copy not found.'));
        }
        
        file_put_contents($templatePath, $cacheContentArray[$recordId]);
        unset($cacheContentArray[$recordId]);
        
        $this->service->cacheUpdate($cacheContentArray);
        
        return $this->json([
            'success' => true
        ]);
    }

    /**
     * @Route("/restore_static", methods={"POST"})
     * @IsGranted("ROLE_ADMIN")
     * @param Request $request
     * @return JsonResponse
     * @throws \Psr\Cache\InvalidArgumentException
     * @throws \Twig\Error\LoaderError
     */
    public function restoreStaticAction(Request $request)
    {
        try {
            $data = $this->getRequestData($request);
        } catch (\Exception $e) {
            return $this->setError($this->translator->trans($e->getMessage()));
        }
        $templateName = $data['templateName'];
        $xpath = $data['xpath'];

        try {
            $result = $this->service->getDocumentNode($templateName, null, true);
        } catch (\Exception $e) {
            return $this->setError($e->getMessage());
        }
        list($templateFilePath, $doc) = $result;

        $node = TwigVisualService::findElementByXPath($doc, $xpath);
        $parentDinamic = TwigVisualService::findDinamicParent($node);
        
        if ($node !== $parentDinamic) {
            return $this->setError($this->translator->trans('You cannot restore the source code of this item.'));
        }

        $commentOpen = TwigVisualService::getPreviousSiblingByType($node, XML_COMMENT_NODE);
        $commentClosed = TwigVisualService::getNextSiblingByType($node, XML_COMMENT_NODE);
        $commentValue = trim($commentOpen->nodeValue);
        
        $cacheDataArray = $this->service->cacheGet();
        if (!isset($cacheDataArray[$commentValue])) {
            return $this->setError($this->translator->trans('You cannot restore the source code of this item.'));
        }

        $node->outerHTML = $cacheDataArray[$commentValue];
        $commentOpen->parentNode->removeChild($commentOpen);
        $commentClosed->parentNode->removeChild($commentClosed);

        try {
            $this->service->saveTemplateContent($doc, $templateFilePath);
        } catch (\Exception $e) {
            return $this->setError($e->getMessage());
        }
        
        unset($cacheDataArray[$commentValue]);
        $this->service->cacheUpdate($cacheDataArray);
        
        return $this->json([
            'success' => true
        ]);
    }

    /**
     * @param Request $request
     * @param bool $checkTemplate
     * @param bool $checkXPath
     * @param bool $isFormData
     * @return mixed
     * @throws \Exception
     * @throws \Twig\Error\LoaderError
     */
    public function getRequestData(Request $request, $checkTemplate = true, $checkXPath = true, $isFormData = false)
    {
        $data = json_decode($request->getContent(), true);
        $data['templateName'] = $isFormData ? $request->get('templateName') : ($data['templateName'] ?? '');
        $data['xpath'] =$isFormData ? $request->get('xpath') : ($data['xpath'] ?? '');

        if (!$this->isGranted($this->service->getConfigValue('editor_user_role'))) {
            throw new \Exception('Your user has read-only permission.');
        }
        if ($checkTemplate && !file_exists($this->service->getDataFilePath())) {
            throw new \Exception('File "twigvisual-data.yaml" not found. You cannot edit templates for this template theme. But you can create a new theme.');
        }
        if ($checkTemplate && !$data['templateName']) {
            throw new \Exception('Template name can not be empty.');
        }
        if ($checkXPath && !$data['xpath']) {
            throw new \Exception('XPath can not be empty.');
        }
        return $data;
    }
    
    /**
     * @param $message
     * @param int $status
     * @return JsonResponse
     */
    public function setError($message, $status = Response::HTTP_UNPROCESSABLE_ENTITY)
    {
        $response = new JsonResponse(["error" => $message]);
        $response = $response->setStatusCode($status);
        return $response;
    }
}
