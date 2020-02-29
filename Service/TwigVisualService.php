<?php

namespace Andchir\TwigVisualBundle\Service;

use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use Doctrine\Common\Persistence\ObjectManager;
use Doctrine\Common\Persistence\ObjectRepository;

class TwigVisualService {
    
    /** @var array */
    protected $config;

    public function __construct(ContainerInterface $container, array $config = [])
    {
        if (empty($config) && $container->hasParameter('twigvisual_config')) {
            $this->config = $container->getParameter('twigvisual_config');
        } else {
            $this->config = $config;
        }
    }
    
    
}
