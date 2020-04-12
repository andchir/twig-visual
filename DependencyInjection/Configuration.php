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

        $treeBuilder->getRootNode()
            ->children()
                ->arrayNode('default_copy')
                    ->scalarPrototype()->end()
                ->end()
                ->arrayNode('cache_location')
                    ->scalarPrototype()->end()
                ->end()
                ->scalarNode('templates_extension')->end()
                ->arrayNode('templates')
                    ->scalarPrototype()->end()
                ->end()
                ->arrayNode('ui')
                    ->useAttributeAsKey('name')
                    ->arrayPrototype()
                        ->prototype('variable')
                    ->end()
                ->end()
            ->end();

        return $treeBuilder;
    }
}
