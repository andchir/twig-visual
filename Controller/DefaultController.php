<?php

namespace Andchir\TwigVisualBundle\Controller;

use Andchir\TwigVisualBundle\Service\TwigVisualService;
use IvoPetkov\HTML5DOMDocument;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\IsGranted;
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
        $mainPageTemplateFilePath = $templateDirPath . DIRECTORY_SEPARATOR . 'homepage.html.twig';

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

        $templateFilePath = $templatesDirPath . DIRECTORY_SEPARATOR . $themeName . DIRECTORY_SEPARATOR  . $templateName . '.html.twig';
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
     */
    public function editTextContentAction(Request $request, TranslatorInterface $translator)
    {
        $data = json_decode($request->getContent(), true);
        $templateName = $data['templateName'] ?? '';
        $xpath = $data['xpath'] ?? '';
        $textContent = $data['textContent'] ?? '';
        
        if (!$templateName) {
            return $this->setError('Template can not be empty.');
        }
        if (!$xpath) {
            return $this->setError('XPath can not be empty.');
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
     */
    public function editLinkAction(Request $request, TranslatorInterface $translator)
    {
        $data = json_decode($request->getContent(), true);
        $templateName = $data['templateName'] ?? '';
        $xpath = $data['xpath'] ?? '';
        $href = $data['href'] ?? '';
        $target = $data['target'] ?? '_self';

        if (!$templateName) {
            return $this->setError('Template can not be empty.');
        }
        if (!$xpath) {
            return $this->setError('XPath can not be empty.');
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
     * @Route("/delete_element", methods={"POST"})
     * @IsGranted("ROLE_ADMIN")
     * @param Request $request
     * @return JsonResponse
     */
    public function deleteElementAction(Request $request)
    {
        $data = json_decode($request->getContent(), true);
        $templateName = $data['templateName'] ?? '';
        $xpath = $data['xpath'] ?? '';

        if (!$templateName) {
            return $this->setError('Template can not be empty.');
        }
        if (!$xpath) {
            return $this->setError('XPath can not be empty.');
        }
        $this->service->setRefererUrl($request->server->get('HTTP_REFERER'));
        if (!$this->service->deleteTemplateElement($templateName, $xpath)) {
            return $this->setError($this->service->getErrorMessage());
        }
        return $this->json([
            'success' => true
        ]);
    }

    /**
     * @Route("/insert/{type}", methods={"POST"})
     * @IsGranted("ROLE_ADMIN")
     * @param Request $request
     * @param TranslatorInterface $translator
     * @return JsonResponse
     */
    public function insertAction(Request $request, TranslatorInterface $translator, $type)
    {
        $data = json_decode($request->getContent(), true);
        $templateName = $data['templateName'] ?? '';
        $uiBlockConfig = $this->service->getConfigValue('ui', $type,  []);

        if (!$templateName) {
            return $this->setError('Template can not be empty.');
        }
        if (!isset($data['data']) || !isset($data['data']['source'])) {
            return $this->setError('Please select a root item.');
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

        switch ($type) {
            case 'include':

                $themeDirPath = $this->service->getCurrentThemeDirPath();
                $templatesExtension = $this->service->getConfigValue('templates_extension');
                $includes = $this->service->getIncludesList(true);
                $includeTemplateName = $data['data']['include'] ?? '';
                $templatePath = $themeDirPath . DIRECTORY_SEPARATOR . TwigVisualService::INCLUDES_DIRNAME;
                $templatePath .= DIRECTORY_SEPARATOR . $includeTemplateName . '.' . $templatesExtension;
                if (!$includeTemplateName || !in_array($includeTemplateName, $includes) || !file_exists($templatePath)) {
                    break;
                }

                $commentKey = 'twv-include-' . TwigVisualService::INCLUDES_DIRNAME . DIRECTORY_SEPARATOR;
                $commentKey .= $includeTemplateName . '.' . $templatesExtension;

                $this->service->elementWrapComment($elements['root'], $commentKey);
                $this->service->setConfigValue('updateIncludeSource', false);

                break;
        }

        // var_dump($uiBlockConfig); exit;
        
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
                
                if (!empty($opts['caching'])) {
                    try {
                        $cacheKey = $this->service->cacheAdd(
                            $opts['sourceHTML'],
                            $templateName . '-' . $type . '-' . $key
                        );
                    } catch (\Exception $e) {
                        $this->setError($e->getMessage());
                        return false;
                    }
                    TwigVisualService::elementWrapComment($elements[$key], $cacheKey);
                }
                if (!empty($opts['templatePath'])) {
                    $tplFilePath = $templateDirPath . DIRECTORY_SEPARATOR .  $opts['templatePath'] . '.html.twig';

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

        if (!($result = $this->service->saveTemplateContent($doc, $templateFilePath))) {
            return $this->setError($this->service->getErrorMessage());
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
                $errors[] = 'The item is already dynamic.';
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

        if (!($this->service->saveTemplateContent($doc, $templateFilePath))) {
            return $this->setError($this->service->getErrorMessage());
        }
        
        return $this->json([
            'success' => true
        ]);
    }

    /**
     * @Route("/move_element", methods={"POST"})
     * @IsGranted("ROLE_ADMIN")
     * @param Request $request
     * @return JsonResponse
     */
    public function moveElementAction(Request $request)
    {
        $data = json_decode($request->getContent(), true);
        $templateName = $data['templateName'] ?? '';
        $xpath = $data['xpath'] ?? '';
        $xpathTarget = $data['xpathTarget'] ?? '';
        $insertMode = $data['insertMode'] ?? 'after';

        try {
            $result = $this->service->getDocumentNode($templateName, null, true);
        } catch (\Exception $e) {
            return $this->setError($e->getMessage());
        }
        list($templateFilePath, $doc) = $result;

        $node = TwigVisualService::findElementByXPath($doc, $xpath);
        if ($this->service->isDinamic($node)) {
            return $this->setError('The item is already dynamic.');
        }

        $nodeTarget = TwigVisualService::findElementByXPath($doc, $xpathTarget);
        if ($this->service->isDinamic($nodeTarget)) {
            return $this->setError('The item is already dynamic.');
        }
        
        switch ($insertMode) {
            case 'inside':
                $nodeTarget->appendChild($node);
                break;
            case 'before':
                $nodeTarget->parentNode->insertBefore($node, $nodeTarget);
                break;
            case 'after':
                $nodeTarget->parentNode->insertBefore($node, $nodeTarget->nextSibling);
                break;
        }

        if (!($this->service->saveTemplateContent($doc, $templateFilePath))) {
            return $this->setError($this->service->getErrorMessage());
        }
        
        return $this->json([
            'success' => true
        ]);
    }

    /**
     * @Route("/restore_static", methods={"POST"})
     * @IsGranted("ROLE_ADMIN")
     * @param Request $request
     * @return JsonResponse
     */
    public function restoreStaticAction(Request $request)
    {
        $data = json_decode($request->getContent(), true);
        $templateName = $data['templateName'] ?? '';
        $xpath = $data['xpath'] ?? '';

        if (!$templateName) {
            return $this->setError('Template can not be empty.');
        }
        if (!$xpath) {
            return $this->setError('XPath can not be empty.');
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
            return $this->setError('You cannot restore the source code of this item.');
        }

        $commentOpen = TwigVisualService::getPreviousSiblingByType($node, XML_COMMENT_NODE);
        $commentClosed = TwigVisualService::getNextSiblingByType($node, XML_COMMENT_NODE);
        $commentValue = trim($commentOpen->nodeValue);
        
        $cacheDataArray = $this->service->cacheGet();
        if (!isset($cacheDataArray[$commentValue])) {
            return $this->setError('You cannot restore the source code of this item.');
        }

        $node->outerHTML = $cacheDataArray[$commentValue];
        $commentOpen->parentNode->removeChild($commentOpen);
        $commentClosed->parentNode->removeChild($commentClosed);

        if (!($this->service->saveTemplateContent($doc, $templateFilePath))) {
            return $this->setError($this->service->getErrorMessage());
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
