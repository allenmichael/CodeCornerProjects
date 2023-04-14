#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CollectableCardStack } from '../cdk-lib/collectable-cards-stack';

const app = new cdk.App();
new CollectableCardStack(app, 'CollectableCardStack', {
});