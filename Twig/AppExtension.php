<?php

namespace Andchir\TwigVisualBundle\Twig;

use Andchir\TwigVisualBundle\Service\TwigVisualService;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Twig\Environment as TwigEnvironment;
use Twig\Extension\AbstractExtension;
use Twig\TwigFilter;
use Twig\TwigFunction;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\RequestStack;

class AppExtension extends AbstractExtension
{
    /** @var ContainerInterface */
    protected $container;
    /** @var  RequestStack */
    protected $requestStack;
    /** @var TwigVisualService */
    protected $service;

    /**
     * AppExtension constructor.
     * @param ContainerInterface $container
     * @param RequestStack $requestStack
     * @param UrlGeneratorInterface $generator
     */
    public function __construct(ContainerInterface $container, RequestStack $requestStack, TwigVisualService $service)
    {
        $this->container = $container;
        $this->requestStack = $requestStack;
        $this->service = $service;
    }

    /**
     * @return array
     */
    public function getFilters()
    {
        return [];
    }

    /**
     * @return array
     */
    public function getFunctions()
    {
        return [
            new TwigFunction('twigVisualOptions', [$this, 'twigVisualOptionsFunction'], [
                'is_safe' => ['html'],
                'needs_environment' => false
            ])
        ];
    }

    /**
     * @param string $templateName
     * @param array $templatContext
     * @return string
     */
    public function twigVisualOptionsFunction($templateName, $templatContext = [])
    {
        $locale = $this->requestStack->getCurrentRequest()->getLocale();
        $output = $this->service->getScriptOptions($templateName, $templatContext, $locale);
        return json_encode($output, JSON_UNESCAPED_UNICODE);
    }
}
