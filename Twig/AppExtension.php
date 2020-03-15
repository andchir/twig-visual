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
     * @param string $type
     * @return string
     */
    public function twigVisualOptionsFunction($type = 'ui')
    {
        $config = $this->service->getConfigValue($type);
        
        if ($type === 'ui') {
            $output = [];
            foreach ($config as $key => $opts) {
                $components = [];
                foreach ($opts['components'] as $k => $v) {
                    if ($k === 'root' || (!isset($v['title']) && !isset($v['type']))) {
                        continue;
                    }
                    $components[] = [
                        'name' => $k,
                        'title' => $v['title'],
                        'type' => $v['type']
                    ];
                }
                $output[$key] = [
                    'title' => $opts['title'],
                    'components' => $components
                ];
            }
            return json_encode($output);
        }
        return json_encode($config);
    }
}
