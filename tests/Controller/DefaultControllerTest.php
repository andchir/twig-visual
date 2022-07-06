<?php

namespace Andchir\TwigVisualBundle\Tests\Service;

use Andchir\TwigVisualBundle\Controller\DefaultController;
use Andchir\TwigVisualBundle\Service\TwigVisualService;
use IvoPetkov\HTML5DOMDocument;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class DefaultControllerTest extends WebTestCase {
    
    public function testOne()
    {
        self::bootKernel();
        // Gets the special container that allows fetching private services
        $container = self::$container;

        /** @var TwigVisualService $twigVisualService */
        $twigVisualService = $container->get('twigvisual');
        
        $controller = new DefaultController($twigVisualService);
        
        $this->assertSame(true, method_exists($controller, 'createThemeAction'));
        
        
    }
}
