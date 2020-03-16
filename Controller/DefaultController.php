<?php

namespace Andchir\TwigVisualBundle\Controller;

use Andchir\TwigVisualBundle\Service\TwigVisualService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
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
        if (!$this->service->deleteElement($templateName, $xpath)) {
            return $this->setError($this->service->getErrorMessage());
        }
        return $this->json([
            'success' => true
        ]);
    }

    /**
     * @Route("/insert/{type}", methods={"POST"})
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
            $result = $this->service->getDocumentNode($templateName, $data['data']['source']);
        } catch (\Exception $e) {
            return $this->setError($e->getMessage());
            return false;
        }
        list($templateFilePath, $doc, $node) = $result;
        $templateDirPath = dirname($templateFilePath);

        $elements = ['root' => $node];
        $uiBlockConfig['components']['root']['outerHTML'] = $node->outerHTML;
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
                        return $this->setError("Element ({$key}) not found for xPath: {$xpathQuery}.");
                    }
                    $elements[$key] = $entries->item(0);
                    $uiBlockConfig['components'][$key]['outerHTML'] = $elements[$key]->outerHTML;
                    break;
                case 'pageField':



                    break;
            }
        }
        
        $configKeys = array_keys($uiBlockConfig['components']);

        // Prepare UI blocks templates
        foreach ($uiBlockConfig['components'] as $key => &$opts) {
            if (!isset($elements[$key]) || !isset($opts['template'])) {
                continue;
            }
            $parentNode = null;
            $innerHTML = '';
            $template = new \IvoPetkov\HTML5DOMDocument();
            $template->loadXML($opts['template']);
            if ($template->hasChildNodes() && $template->childNodes->item(0)->hasChildNodes()) {
                foreach($template->childNodes->item(0)->childNodes as $index => $tChildNode) {
                    if ($tChildNode->nodeType === XML_ELEMENT_NODE) {
                        if (isset($elements[$tChildNode->tagName])) {
                            if (!$parentNode) {
                                $parentNode = isset($elements[$tChildNode->tagName])
                                    ? $elements[$tChildNode->tagName]->parentNode
                                    : $elements[$key];
                            }
                            $innerHTML .= PHP_EOL . "<{$tChildNode->tagName}/>";
                        } else {
                            if (isset($uiBlockConfig['components'][$tChildNode->tagName])) {
                                if (empty($uiBlockConfig['components'][$tChildNode->tagName]['used'])) {
                                    
                                }
                            } else {
                                $childNode = $elements[$key]->querySelector($tChildNode->tagName);
                                if ($childNode) {
                                    $attributes = $tChildNode->getAttributes();
                                    foreach ($attributes as $k => $attribute) {
                                        $childNode->setAttribute($k, $attribute);
                                    }
                                    $childNode->textContent =  $tChildNode->textContent;
                                    if (TwigVisualService::getNextSiblingByType($tChildNode) && TwigVisualService::getNextSiblingByType($childNode)) {
                                        $tNextSibling = TwigVisualService::getNextSiblingByType($tChildNode);
                                        if (isset($uiBlockConfig['components'][$tNextSibling->tagName])) {
                                            TwigVisualService::getNextSiblingByType($childNode)->outerHTML ="<{$tNextSibling->tagName}/>";
                                            $uiBlockConfig['components'][$tNextSibling->tagName]['used'] = true;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    else if ($tChildNode->nodeType === XML_TEXT_NODE) {
                        if ($nodeValue = trim($tChildNode->nodeValue)) {
                            $innerHTML .= PHP_EOL . $nodeValue;
                        }
                    }
                }
            }
            if ($parentNode) {
                $parentNode->innerHTML = $innerHTML . PHP_EOL;
            }
            $opts['outerHTML'] = TwigVisualService::unescapeUrls($elements[$key]->outerHTML);
        }

        foreach ($uiBlockConfig['components'] as $key => $opts) {
            if (!isset($opts['type'])) {
                continue;
            }
            switch ($opts['type']) {
                case 'elementSelect':

                    if (!isset($opts['outerHTML'])) {
                        continue;
                    }
                    $outerHTML = TwigVisualService::replaceXMLTags($opts['outerHTML'], $uiBlockConfig['components'], 'outerHTML');
                    // var_dump($key, $outerHTML);
                    // $outerHTML = $this->service->beautifyHtml->beautify($outerHTML);

                    if (!empty($opts['templatePath'])) {
                        $tplFilePath = $templateDirPath . DIRECTORY_SEPARATOR .  $opts['templatePath'] . '.html.twig';

                        if (!is_dir(dirname($tplFilePath))) {
                            mkdir(dirname($tplFilePath));
                        }
                        if (file_exists($tplFilePath)) {
                            unlink($tplFilePath);
                        }
                        file_put_contents($tplFilePath, $outerHTML);
                    }
                    if (!empty($opts['src'])) {
                        $elements[$key]->outerHTML = $opts['src'];
                    }

                    break;
                case 'pageField':

                    if ($elements['root'] && isset($data['data'][$key])) {
                        $textContent = $data['data'][$key];
                        if (!empty($data['data']['key'])) {
                            $textContent .= '.' . $data['data']['key'];
                        }
                        $elements['root']->textContent = "{{ {$textContent} }}";
                    }

                    break;
            }
        }

        if (!($result = $this->service->saveTemplateContent($doc, $templateFilePath))) {
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
