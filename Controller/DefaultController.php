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
     * @Route("/create", methods={"GET", "POST"})
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
        
        if (!is_dir($templateDirPath)) {
            mkdir($templateDirPath);
        }
        //if (!file_exists($mainPageTemplateFilePath)) {
            $templateContent = $this->service->prepareTemplateContent($mainPagePublicFilePath, $themeName);
            file_put_contents($mainPageTemplateFilePath, $templateContent);
        //}
        
        return $this->json([
            'success' => true,
            'message' => $translator->trans('Templates theme created successfully.')
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
