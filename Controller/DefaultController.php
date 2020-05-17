<?php

namespace Andchir\TwigVisualBundle\Controller;

use Andchir\TwigVisualBundle\Service\TwigVisualService;
use App\Service\UtilsService;
use IvoPetkov\HTML5DOMDocument;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\IsGranted;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\Response;
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

    public function __construct(TwigVisualService $service)
    {
        $this->service = $service;
    }

    /**
     * @Route("/create", methods={"POST"})
     * @IsGranted("ROLE_ADMIN")
     * @return JsonResponse
     * @throws \Twig\Error\LoaderError
     */
    public function createThemeAction(Request $request, TranslatorInterface $translator)
    {
        $data = json_decode($request->getContent(), true);
        $themeName = $data['theme'] ?? '';
        $mainpage = $data['mainpage'] ?? '';

        $templatesDirPath = $this->service->getTemplatesDirPath();
        $publicTemplateDirPath = $this->service->getPublicTemplateDirPath($themeName);
        
        if (!is_dir($publicTemplateDirPath)) {
            return $this->setError($translator->trans('Please upload the template files (HTML, CSS, images) at "%themePath%".', [
                '%themePath%' => str_replace($this->service->getRootDirPath(), '', $publicTemplateDirPath)
            ]));
        }

        $mainPagePublicFilePath = $publicTemplateDirPath . DIRECTORY_SEPARATOR . $mainpage;
        if (TwigVisualService::getExtension($mainpage) !== 'html') {
            return $this->setError($translator->trans('The main page file must be of type HTML.'));
        }
        if (!$mainpage || !file_exists($mainPagePublicFilePath)) {
            return $this->setError($translator->trans('Home page file not found.'));
        }

        $templateDirPath = $templatesDirPath . DIRECTORY_SEPARATOR . $themeName;
        $mainPageTemplateFilePath = $templateDirPath . DIRECTORY_SEPARATOR . 'homepage';
        $mainPageTemplateFilePath .= '.' . $this->service->getConfigValue('templates_extension');
        
        if (!$this->service->copyDefaultFiles($themeName)) {
            return $this->setError($translator->trans('Error copying files by default.'));
        }
        if (!is_dir($templateDirPath)) {
            mkdir($templateDirPath);
        }

        $templateContent = $this->service->prepareTemplateContent($mainPagePublicFilePath, $themeName);
        file_put_contents($mainPageTemplateFilePath, $templateContent);
        
        return $this->json([
            'success' => true,
            'message' => $translator->trans('Templates theme created successfully.')
        ]);
    }

    /**
     * @Route("/create_template", methods={"POST"})
     * @IsGranted("ROLE_ADMIN")
     * @return JsonResponse
     * @throws \Twig\Error\LoaderError
     */
    public function createTemplateAction(Request $request, TranslatorInterface $translator)
    {
        $data = json_decode($request->getContent(), true);
        $fileName = $data['fileName'] ?? '';
        $templateName = $data['templateName'] ?? '';

        if (!$fileName || !$templateName) {
            return $this->setError($translator->trans('File name and template name should not be empty.'));
        }

        $themeName = $this->service->getCurrentThemeName();
        $templatesDirPath = $this->service->getTemplatesDirPath();
        $publicTemplateDirPath = $this->service->getPublicTemplateDirPath($themeName);

        if (!is_dir($publicTemplateDirPath)) {
            return $this->setError($translator->trans('Please upload the template files (HTML, CSS, images) at "%themePath%".', [
                '%themePath%' => str_replace($this->service->getRootDirPath(), '', $publicTemplateDirPath)
            ]));
        }

        $templateFilePath = $templatesDirPath . DIRECTORY_SEPARATOR . $themeName . DIRECTORY_SEPARATOR  . $templateName;
        $templateFilePath .= '.' . $this->service->getConfigValue('templates_extension');
        $pagePublicFilePath = $publicTemplateDirPath . DIRECTORY_SEPARATOR . $fileName;
        if (TwigVisualService::getExtension($fileName) !== 'html') {
            return $this->setError($translator->trans('The main page file must be of type HTML.'));
        }
        if (!$fileName || !file_exists($pagePublicFilePath)) {
            return $this->setError($translator->trans('Page HTML file not found.'));
        }

        if (!is_dir(dirname($templateFilePath))) {
            mkdir(dirname($templateFilePath));
        }

        $templateContent = $this->service->prepareTemplateContent($pagePublicFilePath, $themeName);
        file_put_contents($templateFilePath, $templateContent);
        
        return $this->json([
            'success' => true,
            'message' => $translator->trans('Template created successfully.')
        ]);
    }

    /**
     * @Route("/edit_content", methods={"POST"})
     * @IsGranted("ROLE_ADMIN")
     * @param Request $request
     * @param TranslatorInterface $translator
     * @return JsonResponse
     * @throws \Psr\Cache\InvalidArgumentException
     * @throws \Twig\Error\LoaderError
     */
    public function editTextContentAction(Request $request, TranslatorInterface $translator)
    {
        $data = json_decode($request->getContent(), true);
        $templateName = $data['templateName'] ?? '';
        $xpath = $data['xpath'] ?? '';
        $textContent = $data['textContent'] ?? '';
        
        if (!$templateName) {
            return $this->setError($translator->trans('Template name can not be empty.'));
        }
        if (!$xpath) {
            return $this->setError($translator->trans('XPath can not be empty.'));
        }
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
     * @param TranslatorInterface $translator
     * @return JsonResponse
     * @throws \Psr\Cache\InvalidArgumentException
     * @throws \Twig\Error\LoaderError
     */
    public function editLinkAction(Request $request, TranslatorInterface $translator)
    {
        $data = json_decode($request->getContent(), true);
        $templateName = $data['templateName'] ?? '';
        $xpath = $data['xpath'] ?? '';
        $href = $data['href'] ?? '';
        $target = $data['target'] ?? '_self';

        if (!$templateName) {
            return $this->setError($translator->trans('Template name can not be empty.'));
        }
        if (!$xpath) {
            return $this->setError($translator->trans('XPath can not be empty.'));
        }
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
     * @param TranslatorInterface $translator
     * @return JsonResponse
     * @throws \Psr\Cache\InvalidArgumentException
     * @throws \Twig\Error\LoaderError
     */
    public function replaceImageAction(Request $request, TranslatorInterface $translator)
    {
        $templateName = $request->get('templateName');
        $xpath = $request->get('xpath');
        $attributeName = $request->get('attributeName', 'src');
        /** @var UploadedFile $imageFile */
        $imageFile = $request->files->get('imageFile');

        if (!$templateName) {
            return $this->setError($translator->trans('Template name can not be empty.'));
        }
        if (!$xpath) {
            return $this->setError($translator->trans('XPath can not be empty.'));
        }
        if (!$imageFile) {
            return $this->setError($translator->trans('Image file has not been uploaded.'));
        }
        if (!in_array(UtilsService::getExtension($imageFile->getClientOriginalName()), ['jpg','jpeg','png','gif'])) {
            return $this->setError($translator->trans('File type is not allowed.'));
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
            return $this->setError($translator->trans($this->service->getErrorMessage()));
        }

        return $this->json([
            'success' => true
        ]);
    }

    /**
     * @Route("/delete_element", methods={"POST"})
     * @IsGranted("ROLE_ADMIN")
     * @param Request $request
     * @param TranslatorInterface $translator
     * @return JsonResponse
     * @throws \Psr\Cache\InvalidArgumentException
     * @throws \Twig\Error\LoaderError
     */
    public function deleteElementAction(Request $request, TranslatorInterface $translator)
    {
        $data = json_decode($request->getContent(), true);
        $templateName = $data['templateName'] ?? '';
        $xpath = $data['xpath'] ?? '';
        $clean = $data['clean'] ?? false;

        if (!$templateName) {
            return $this->setError($translator->trans('Template name can not be empty.'));
        }
        if (!$xpath) {
            return $this->setError($translator->trans('XPath can not be empty.'));
        }
        $this->service->setRefererUrl($request->server->get('HTTP_REFERER'));
        if (!$this->service->deleteTemplateElement($templateName, $xpath, $clean)) {
            return $this->setError($this->service->getErrorMessage());
        }
        return $this->json([
            'success' => true
        ]);
    }

    /**
     * @Route("/insert/{actionName}", methods={"POST"})
     * @IsGranted("ROLE_ADMIN")
     * @param Request $request
     * @param TranslatorInterface $translator
     * @param string $actionName
     * @return JsonResponse
     * @throws \Psr\Cache\InvalidArgumentException
     * @throws \Twig\Error\LoaderError
     */
    public function insertAction(Request $request, TranslatorInterface $translator, $actionName)
    {
        $data = json_decode($request->getContent(), true);
        $templateName = $data['templateName'] ?? '';
        $uiBlockConfig = $this->service->getConfigValue('ui', $actionName,  []);

        if (!$templateName) {
            return $this->setError($translator->trans('Template name can not be empty.'));
        }
        if (!isset($data['data']) || !isset($data['data']['source'])) {
            return $this->setError($translator->trans('Please select a root item.'));
        }
        
        // Update configuration
        if (!empty($uiBlockConfig['configuration']) && is_array($uiBlockConfig['configuration'])) {
            foreach ($uiBlockConfig['configuration'] as $key => $val) {
                $this->service->setConfigValue($key, $val);
            }
        }
        
        try {
            $result = $this->service->getDocumentNode($templateName, $data['data']['source'], true);
        } catch (\Exception $e) {
            return $this->setError($e->getMessage());
        }
        /** @var HTML5DOMDocument $doc */
        list($templateFilePath, $doc, $node) = $result;
        $templateDirPath = dirname($templateFilePath);
        
        // Step #1
        $elements = $this->service->getUiElements($doc, $data, $uiBlockConfig);
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
                $outerHTML = $this->service->beautify($outerHTML);
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
        
        // var_dump($doc->saveHTML()); exit;
        
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
     * @Route("/includes", methods={"GET"})
     * @IsGranted("ROLE_ADMIN")
     * @param Request $request
     * @param TranslatorInterface $translator
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
     * @param TranslatorInterface $translator
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
     * @param TranslatorInterface $translator
     * @return JsonResponse
     * @throws \Psr\Cache\InvalidArgumentException
     * @throws \Twig\Error\LoaderError
     */
    public function batchAction(Request $request, TranslatorInterface $translator)
    {
        $data = json_decode($request->getContent(), true);
        $templateName = $data['templateName'] ?? '';
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
                $errors[] = $translator->trans('The item is already dynamic.');
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
     * @param TranslatorInterface $translator
     * @return JsonResponse
     * @throws \Twig\Error\LoaderError
     */
    public function restoreBackupAction(Request $request, TranslatorInterface $translator)
    {
        $data = json_decode($request->getContent(), true);
        $templateName = $data['templateName'] ?? '';

        if (!$templateName) {
            return $this->setError($translator->trans('Template name can not be empty.'));
        }

        $themeDirPath = $this->service->getCurrentThemeDirPath();
        $templatePath = $themeDirPath . DIRECTORY_SEPARATOR . $templateName;
        
        if (!file_exists($templatePath)) {
            return $this->setError($translator->trans('Template not found.'));
        }

        $recordId = 'backup-copy-' . $templateName;
        $cacheContentArray = $this->service->cacheGet();
        if (!isset($cacheContentArray[$recordId])) {
            return $this->setError($translator->trans('Backup copy not found.'));
        }
        
        file_put_contents($templatePath, $cacheContentArray[$recordId]);
        unset($cacheContentArray[$recordId]);
        
        $this->service->cacheUpdate($cacheContentArray);
        
        return $this->json([
            'success' => true
        ]);
    }

    /**
     * @Route("/move_element", methods={"POST"})
     * @IsGranted("ROLE_ADMIN")
     * @param Request $request
     * @param TranslatorInterface $translator
     * @return JsonResponse
     * @throws \Psr\Cache\InvalidArgumentException
     */
    public function moveElementAction(Request $request, TranslatorInterface $translator)
    {
        $data = json_decode($request->getContent(), true);
        $templateName = $data['templateName'] ?? '';
        $xpath = $data['xpath'] ?? '';
        $xpathTarget = $data['xpathTarget'] ?? '';
        $insertMode = $data['insertMode'] ?? TwigVisualService::INSERT_MODE_AFTER;

        if (!($result = $this->service->moveElement($templateName, $xpath, $xpathTarget, $insertMode))) {
            return $this->setError($translator->trans($this->service->getErrorMessage()));
        }
        
        return $this->json([
            'success' => true
        ]);
    }

    /**
     * @Route("/restore_static", methods={"POST"})
     * @IsGranted("ROLE_ADMIN")
     * @param Request $request
     * @param TranslatorInterface $translator
     * @return JsonResponse
     * @throws \Psr\Cache\InvalidArgumentException
     * @throws \Twig\Error\LoaderError
     */
    public function restoreStaticAction(Request $request, TranslatorInterface $translator)
    {
        $data = json_decode($request->getContent(), true);
        $templateName = $data['templateName'] ?? '';
        $xpath = $data['xpath'] ?? '';

        if (!$templateName) {
            return $this->setError($translator->trans('Template name can not be empty.'));
        }
        if (!$xpath) {
            return $this->setError($translator->trans('XPath can not be empty.'));
        }

        try {
            $result = $this->service->getDocumentNode($templateName, null, true);
        } catch (\Exception $e) {
            return $this->setError($e->getMessage());
        }
        list($templateFilePath, $doc) = $result;

        $node = TwigVisualService::findElementByXPath($doc, $xpath);
        $parentDinamic = TwigVisualService::findDinamicParent($node);
        
        if ($node !== $parentDinamic) {
            return $this->setError($translator->trans('You cannot restore the source code of this item.'));
        }

        $commentOpen = TwigVisualService::getPreviousSiblingByType($node, XML_COMMENT_NODE);
        $commentClosed = TwigVisualService::getNextSiblingByType($node, XML_COMMENT_NODE);
        $commentValue = trim($commentOpen->nodeValue);
        
        $cacheDataArray = $this->service->cacheGet();
        if (!isset($cacheDataArray[$commentValue])) {
            return $this->setError($translator->trans('You cannot restore the source code of this item.'));
        }

        $node->outerHTML = $cacheDataArray[$commentValue];
        $commentOpen->parentNode->removeChild($commentOpen);
        $commentClosed->parentNode->removeChild($commentClosed);

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
