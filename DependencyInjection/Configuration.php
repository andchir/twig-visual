<?php

namespace Andchir\TwigVisualBundle\DependencyInjection;

use Symfony\Component\Config\Definition\Builder\TreeBuilder;
use Symfony\Component\Config\Definition\ConfigurationInterface;

/**
 * This is the class that validates and merges configuration from your app/config files.
 *
 * To learn more see {@link http://symfony.com/doc/current/cookbook/bundles/configuration.html}
 */
class Configuration implements ConfigurationInterface
{
    /**
     * {@inheritdoc}
     */
    public function getConfigTreeBuilder()
    {
        $treeBuilder = new TreeBuilder('twigvisual');

//        $treeBuilder->getRootNode()
//            ->children()
//                ->scalarNode('comment_class')->end()
//                ->scalarNode('status_default')->end()
//            ->end();

        return $treeBuilder;
    }
}
