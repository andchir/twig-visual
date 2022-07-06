<?php

namespace Andchir\TwigVisualBundle\Tests\Service;

use Andchir\TwigVisualBundle\Service\TwigVisualService;
use IvoPetkov\HTML5DOMDocument;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class TwigVisualServiceTest extends WebTestCase {
    
    public $documentSourceCode = '
<!DOCTYPE html>
<html lang="en">
<head>
	<title>Home</title>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="stylesheet" type="text/css" href="vendor/bootstrap/css/bootstrap.min.css">
</head>
<body>
	<header class="header1">
		<div class="container-menu-header">
			<div class="topbar">
				<div class="topbar-social">
					<a href="#" class="topbar-social-item fa fa-facebook"></a>
					<a href="#" class="topbar-social-item fa fa-instagram"></a>
					<a href="#" class="topbar-social-item fa fa-pinterest-p"></a>
				</div>
				<span class="topbar-child1">
					Free shipping for standard order over $100
				</span>
				<div class="topbar-child2">
					<span class="topbar-email">
						fashe@example.com
					</span>
				</div>
			</div>
			<div class="wrap_header">
				<a href="index.html" class="logo">
					<img src="images/icons/logo.png" alt="IMG-LOGO">
				</a>
				<div class="wrap_menu">
					<nav class="menu">
						<ul class="main_menu">
							<li>
								<a href="index.html">Home</a>
								<ul class="sub_menu">
									<li><a href="index.html">Homepage V1</a></li>
									<li><a href="home-02.html">Homepage V2</a></li>
									<li><a href="home-03.html">Homepage V3</a></li>
								</ul>
							</li>
							<li>
								<a href="product.html">Shop</a>
							</li>
							<li class="sale-noti">
								<a href="product.html">Sale</a>
							</li>
							<li>
								<a href="about.html">About</a>
							</li>
							<li>
								<a href="contact.html">Contact</a>
							</li>
						</ul>
					</nav>
				</div>
			</div>
		</div>
	</header>
	<footer class="bg6 p-t-45 p-b-43 p-l-45 p-r-45">
		<div class="flex-w p-b-90">
			<div class="w-size7 p-t-30 p-l-15 p-r-15 respon4">
				<h4 class="s-text12 p-b-30">
					Links
				</h4>
				<ul>
					<li class="p-b-9">
						<a href="#" class="s-text7">
							Search
						</a>
					</li>
					<li class="p-b-9">
						<a href="#" class="s-text7">
							About Us
						</a>
					</li>
				</ul>
			</div>
	</footer>
	<script src="js/main.js"></script>
</body>
</html>';
    
    public function testGetScriptOptions()
    {
        self::bootKernel();
        // Gets the special container that allows fetching private services
        $container = self::$container;

        /** @var TwigVisualService $twigVisualService */
        $twigVisualService = $container->get('twigvisual');

        $xpathQuery = '/html[1]/body[1]/header[1]/div[1]';
        
        $doc = new HTML5DOMDocument();
        $doc->loadHTML($this->documentSourceCode);
        /** @var \DOMElement $node */
        $node = TwigVisualService::findElementByXPath($doc, $xpathQuery);
        
        $this->assertSame('div', $node->tagName);
        $this->assertSame(5, $node->childNodes->count());
        $this->assertSame('container-menu-header', $node->getAttributes()['class']);
    }
}
